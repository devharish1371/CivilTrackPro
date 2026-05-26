export function generateKML(projects) {
  const placemarks = projects
    .filter(p => p.latitude && p.longitude)
    .map(p => {
      const status = p.statusOfWork === 'completed' ? 'Completed' : p.statusOfWork === 'in_progress' ? 'In Progress' : 'Yet to Start';
      return `    <Placemark>
      <name><![CDATA[${p.projectName}]]></name>
      <description><![CDATA[
Scheme: ${p.scheme}
Constituency: ${p.constituency}
Status: ${status}
Progress: ${p.progress}%
Sanctioned: ₹${(p.sanctionedAmount || 0).toLocaleString('en-IN')}
Contractor: ${p.contractorName}
JE: ${p.juniorEngineer}
AE: ${p.assistantEngineer}
      ]]></description>
      <styleUrl>${p.statusOfWork === 'completed' ? '#green' : p.statusOfWork === 'in_progress' ? '#amber' : '#gray'}</styleUrl>
      <Point>
        <coordinates>${p.longitude},${p.latitude},0</coordinates>
      </Point>
    </Placemark>`;
    }).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>CivilTrack Pro — Project Locations</name>
  <description>Exported on ${new Date().toLocaleDateString('en-IN')}</description>
  <Style id="green"><IconStyle><color>ff00ff00</color><scale>1.2</scale></IconStyle></Style>
  <Style id="amber"><IconStyle><color>ff00aaff</color><scale>1.2</scale></IconStyle></Style>
  <Style id="gray"><IconStyle><color>ff888888</color><scale>1.0</scale></IconStyle></Style>
${placemarks}
</Document>
</kml>`;
}

export function downloadKML(projects, filename = 'CivilTrack_Projects.kml') {
  const kml = generateKML(projects);
  const blob = new Blob([kml], { type: 'application/vnd.google-earth.kml+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
