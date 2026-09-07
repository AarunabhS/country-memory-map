const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('fs');const vm=require('vm');const path=require('path');
const root=path.join(__dirname,'..');const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
const context=vm.createContext({window:{},GeographyGame:require('../game-core.js')});
for(const file of ['countries-data.js','capitals-data.js','country-borders.js','flag-data.js','game-data.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),context);
let legacy=source.slice(source.indexOf('    const countryOnlyAdminNames'),source.indexOf('    const continentLonLatBounds'))+source.slice(source.indexOf('    const manualAliases'),source.indexOf('    const foundIds'));
for(const name of ['normalize','displayName','adminName','countryContinent','isCountryFeature','splitAliases','aliasesFor'])legacy+=source.match(new RegExp('    function '+name+'\\([\\s\\S]*?\\n    }'))[0];
vm.runInContext(legacy+`
const features=window.COUNTRIES_GEOJSON.features.filter(isCountryFeature);
const records=features.map((f,i)=>({id:f.properties.ADM0_A3+'-'+(f.properties.NE_ID||i),name:displayName(f),continent:countryContinent(f)}));
const featuresById=new Map(records.map((r,i)=>[r.id,features[i]]));
const ids=new Map();records.forEach((r,i)=>{ids.set(r.name,r.id);ids.set(features[i].properties.ADMIN,r.id);});
const bridge={countries:records,feature:id=>featuresById.get(id),countryId:name=>ids.get(name),aliases:id=>aliasesFor(featuresById.get(id)),capitals:window.CAPITALS_DATA.map(c=>({...c,countryId:ids.get(c.country)}))};
const data=window.buildGameCountries(bridge);`,context);
const countries=vm.runInContext('data',context);

module.exports=JSON.parse(JSON.stringify(countries));
