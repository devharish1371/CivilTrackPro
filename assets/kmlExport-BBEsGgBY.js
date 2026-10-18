function e(e){let t=e.filter(e=>e.latitude&&e.longitude).map(e=>{let t=e.statusOfWork===`completed`?`Completed`:e.statusOfWork===`in_progress`?`In Progress`:`Yet to Start`;return`    <Placemark>
      <name><![CDATA[${e.projectName}]]></name>
      <description><![CDATA[
Scheme: ${e.scheme}
Constituency: ${e.constituency}
Status: ${t}
Progress: ${e.progress}%
Sanctioned: ₹${(e.sanctionedAmount||0).toLocaleString(`en-IN`)}
Contractor: ${e.contractorName}
JE: ${e.juniorEngineer}
AE: ${e.assistantEngineer}
      ]]></description>
      <styleUrl>${e.statusOfWork===`completed`?`#green`:e.statusOfWork===`in_progress`?`#amber`:`#gray`}</styleUrl>
      <Point>
        <coordinates>${e.longitude},${e.latitude},0</coordinates>
      </Point>
    </Placemark>`}).join(`
`);return`<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>CivilTrack Pro — Project Locations</name>
  <description>Exported on ${new Date().toLocaleDateString(`en-IN`)}</description>
  <Style id="green"><IconStyle><color>ff00ff00</color><scale>1.2</scale></IconStyle></Style>
  <Style id="amber"><IconStyle><color>ff00aaff</color><scale>1.2</scale></IconStyle></Style>
  <Style id="gray"><IconStyle><color>ff888888</color><scale>1.0</scale></IconStyle></Style>
${t}
</Document>
</kml>`}function t(t,n=`CivilTrack_Projects.kml`){let r=e(t),i=new Blob([r],{type:`application/vnd.google-earth.kml+xml`}),a=URL.createObjectURL(i),o=document.createElement(`a`);o.href=a,o.download=n,o.click(),URL.revokeObjectURL(a)}export{t};