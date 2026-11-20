import {useEffect,useRef,useState} from 'react'
export default function useChime() {
  const audio=useRef(null),[on,setOn]=useState(false),[error,setError]=useState('')
  useEffect(()=>()=>{audio.current?.close()},[])
  function play() {
    const ctx=audio.current
    if(!ctx||ctx.state!=='running')return
    ;[196,293.66,392].forEach((frequency,i)=>{
      const note=ctx.createOscillator(),gain=ctx.createGain(),start=ctx.currentTime+.12*i
      note.frequency.value=frequency
      gain.gain.setValueAtTime(.0001,start)
      gain.gain.exponentialRampToValueAtTime(.035,start+.06)
      gain.gain.exponentialRampToValueAtTime(.0001,start+1.1)
      note.connect(gain).connect(ctx.destination);note.start(start);note.stop(start+1.12)
    })
  }
  async function toggle() {
    try {
      if(on){await audio.current.suspend();setOn(false);return}
      if(!audio.current) audio.current=new (window.AudioContext||window.webkitAudioContext)()
      await audio.current.resume();setOn(true);play()
    } catch {setError('El sonido no está disponible en este navegador.')}
  }
  return {on,toggle,play,error}
}
