// Geographic centers are display anchors. Country-level sources retain country-level precision.
import {addItineraries} from './itineraries'
import {api} from '../services/api'
import {witnesses} from '../data/witnesses'

const anchors = {
  'Tobar, Burgos': [-3.94, 42.48],
  'Viseu, Portugal': [-7.91, 40.66]
}
export const destinations = {México:[-102,24], España:[-4,40], Portugal:[-8,39.5], Brasil:[-52,-13], Argentina:[-65,-35]}

function recordFor(name, result) {
  if (!result) return {name, points:[], connections:[]}
  const points = [], connections = []
  const {place,source,url,summary} = result
  if (anchors[place]) points.push({id:'place',place,coordinates:anchors[place],period:'Sin fecha establecida',source,url,text:summary,certainty:'Referencia toponímica'})
  const witness = witnesses[result.name]
  if (result.name === 'Tovar') points.push({id:'mexico',place:'México',coordinates:destinations.México,period:witness.year,source:witness.reference,url:witness.url,text:witness.story,certainty:'Manuscrito catalogado · ubicación nacional'})
  if (result.name === 'Amaral') {
    const evidence={period:'1922',source:witness.reference,url:witness.url,certainty:'Biografía documentada'}
    points.push({...evidence,id:'paris',place:'París',coordinates:[2.35,48.86],text:'Tarsila do Amaral estudiaba en París durante la Semana de Arte Moderno de 1922.'},
      {...evidence,id:'brasil',place:'Brasil',coordinates:destinations.Brasil,text:'A mediados de 1922 Tarsila regresó a Brasil. El punto representa el país. La fuente no precisa aquí un puerto de llegada.'})
    connections.push({from:'paris',to:'brasil',person:'Tarsila do Amaral',period:'1922',type:'documented',certainty:'Testimonio biográfico publicado',text:'Regreso de Tarsila do Amaral a Brasil · mediados de 1922',url:witness.url})
  }
  return addItineraries({name:result.name,points,connections})
}

export async function research(names) {
  const rows=await Promise.all(names.map(async name=>{
    const {result,matches}=await (await api('/surnames?q='+encodeURIComponent(name))).json()
    return {...recordFor(name,result),matches:result?[]:matches||[]}
  }))
  if(names.length===1 && rows[0].matches.length===2) return research(rows[0].matches)
  return rows.filter((row,i)=>rows.findIndex(r=>r.name.toLocaleLowerCase()===row.name.toLocaleLowerCase())===i)
}

export const demo={name:'Demostración',demo:true,points:[
  {id:'a',place:'Punto A',coordinates:[-32,38],period:'Escena inicial',text:'Una marca de prueba permite explorar cómo se lee un punto en el mapa.',certainty:'Recreación visual'},
  {id:'b',place:'Punto B',coordinates:[-55,14],period:'Escena final',text:'Esta línea ilustra la animación entre dos coordenadas ficticias.',certainty:'Recreación visual'}
],connections:[{from:'a',to:'b',type:'recreation',text:'Trayecto ficticio para probar el mapa.'}]}
