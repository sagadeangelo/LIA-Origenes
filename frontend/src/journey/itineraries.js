// Each itinerary is independently sourced. Continuity exists only within one itinerary.
const tovar = [
  {
    person:'Pedro de Tovar', period:'1540', source:'National Park Service · Hawikuh and the Seven Cities of Cibola, pp. 27–28',
    url:'https://www.nps.gov/parkhistory/online_books/zuci/zuci_seven_cities.pdf',
    stops:[
      ['Hawikuh',[-108.99,34.94],'En el verano de 1540, Coronado envió desde Hawikuh una partida al mando de Pedro de Tovar.'],
      ['Pueblos hopi',[-110.5,35.85],'La expedición llegó a territorio hopi, donde se produjo un enfrentamiento. El punto señala la región descrita por la fuente.']
    ]
  },{
    person:'Antonio Tovar',period:'1936',source:'Alfredo Mederos Martín · Lucentum XXXI (2012), p. 207',
    url:'https://rua.ua.es/dspace/bitstream/10045/28867/1/Lucentum_31_12.pdf',
    stops:[
      ['París',[2.35,48.86],'Antonio Tovar dejó París en marzo de 1936 para intentar defender su tesis en Madrid.'],
      ['Madrid',[-3.70,40.42],'Las huelgas impidieron la defensa. Esa primavera continuó hacia Berlín.'],
      ['Berlín',[13.40,52.52],'En Berlín residió en la Hegelhaus. A finales de agosto regresó a España.']
    ]
  },{
    person:'Antonio Tovar',period:'1948–1958 · trayectoria docente',source:'Universidad Nacional del Nordeste · Actas de Estudios Clásicos',
    url:'https://hum.unne.edu.ar/publicaciones/insletras/actas_clasicos_21.pdf',
    stops:[
      ['Buenos Aires',[-58.38,-34.60],'Entre 1948 y 1949 Antonio Tovar enseñó griego en Buenos Aires.'],
      ['Salamanca',[-5.66,40.97],'Regresó a España en 1950 y posteriormente asumió el rectorado en Salamanca.'],
      ['San Miguel de Tucumán',[-65.22,-26.83],'En 1958 volvió a Argentina para enseñar en la Universidad de Tucumán. La línea enlaza destinos docentes documentados.']
    ]
  }
]
const amaral = [
  {
    person:'Tarsila do Amaral',period:'1931',source:'Museo Guggenheim Bilbao · Cronología de Tarsila do Amaral',
    url:'https://www.guggenheim-bilbao.eus/en/did-you-know/chronology-tarsila-do-amaral',
    stops:[
      ['Moscú',[37.62,55.75],'Tarsila viajó a la Unión Soviética con Osório César y expuso en Moscú.'],
      ['París',[2.35,48.86],'A la vuelta de aquel viaje hizo escala en París y expuso en el Salon des Surindépendants.']
    ]
  },{
    person:'Olga de Amaral',period:'Desde 1954 · trayectoria artística',source:'Cranbrook Academy of Art · Olga de Amaral',
    url:'https://cranbrookart.edu/press-room/olga-de-amaral-to-receive-honorary-master-of-fine-arts-degree-from-cranbrook-academy-of-art/',
    stops:[
      ['Bloomfield Hills',[-83.24,42.58],'Olga estudió textiles en Cranbrook en 1954–1955. Allí conoció al escultor Jim Amaral.'],
      ['Bogotá',[-74.07,4.71],'Olga y Jim desarrollaron sus prácticas artísticas y un taller de diseño en Bogotá. La artista figura en los archivos con el nombre profesional Olga de Amaral.']
    ]
  }
]
export function addItineraries(record){
  const trips={Tovar:tovar,Amaral:amaral}[record.name]||[]
  trips.forEach(({person,period,source,url,stops},trip)=>{
    let previous
    for(const [place,coordinates,text] of stops){
      const id='trip-'+trip+'-'+place
      record.points.push({id,place,coordinates,text,period,source,url,person,certainty:'Trayectoria biográfica documentada'})
      if(previous)record.connections.push({from:previous.id,to:id,type:'documented',person,period,url,text:previous.place+' → '+place})
      previous={id,place}
    }
  })
  return record
}
