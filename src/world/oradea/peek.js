// The phone page's 3D peek for Oradea (ui/peek3d.js): place id -> [site module in ./sites/, builder, terrain hook?], the
// keys of the module's SITE that city.js calls. A new hand-built place joins with a line here.
const site = (file, shape = false) => [file, 'build', ...(shape ? ['shape'] : [])];
export const PEEK = {
  piataunirii: site('unirii'), lunachurch: site('unirii'), sfnicolae: site('unirii'), palatulepiscopal: site('unirii'),
  primaria: site('primaria'), vulturulnegru: site('primaria'),
  teatrureginamaria: site('ferdinand'), piataferdinand: site('ferdinand'), darvaslaroche: site('ferdinand'), sinagogasion: site('ferdinand'),
  cetateoradea: site('cetate', true),
  bazilica: site('baroc', true), palatulbaroc: site('baroc', true), sirulcanonicilor: site('baroc', true),
  calearepublicii: site('republicii'), moskovits: site('republicii'), ullmann: site('republicii'),
  moskovitsadolf: site('unirii-est'), kovats: site('unirii-est'), iuliumaniu: site('unirii-est'), alecsandri: site('unirii-est'),
  garaoradea: site('gara'), oradeaarena: site('gara'),
  catedralaortodoxa: site('orthodox'), sftreime: site('orthodox'), sfandrei: site('orthodox'), sfmihailgavriil: site('orthodox'), bisericalemn: site('orthodox'),
  emanuel: site('baptist', true), bbso: site('baptist', true),
  premonstratense: site('catholic'), seminargreco: site('catholic'), duhsfant: site('catholic'), mizericordieni: site('catholic'), // sfanaursuline: its front leans on the republicii block, so no peek
  reformataorasulnou: site('reformed'), reformataolosig: site('reformed'), evanghelica: site('reformed'), sinagogamare: site('reformed'), aachvasrein: site('reformed'),
  penticostalabetania: site('pentecostal'), penticostalafiladelfia: site('pentecostal'), penticostalabetel: site('pentecostal'), penticostalatabor: site('pentecostal'),
  univoradea: site('university'), partiumvechi: site('university'), medicina: site('university'), aranyjanos: site('university'),
  drept: site('university'), constructii: site('university'), agora: site('university'), univemanuel: site('university'),
  astoria: site('civic'), palatuljustitiei: site('civic'), prefectura: site('civic'), palatulposta: site('civic'), palatulfinantelor: site('civic'),
  lotuscenter: site('civic'), nymphaea: site('civic'), // the water towers are too small for a peek
};
