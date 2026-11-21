// Catppuccin Mocha. Rails describe the composers represented here, not hard
// historical boundaries. A dot, not the presence of a passing line, means membership.
export const eras=[
 ['Contemporary','#cba6f7'],['Minimalism','#f5c2e7'],['Serialism','#b4befe'],
 ['Modern','#89b4fa'],['Neoclassicism','#74c7ec'],['Impressionism','#89dceb'],
 ['Post-Romanticism','#fab387'],['Late Romanticism','#f2cdcd'],['Romantic','#f38ba8'],
 ['Classical','#f9e2af'],['Baroque','#a6e3a1'],['Renaissance','#94e2d5']
];
export function routes(rows){
 const ranges=eras.map(([name,color])=>{
  const member=rows.flatMap((r,i)=>[...r.periods,...r.styles].includes(name)?[i]:[]);
  if(!member.length)throw Error('Missing movement: '+name);
  return {name,color,first:member[0],last:member.at(-1),members:new Set(member)};
 });
 const ends=[];
 for(const r of [...ranges].sort((a,b)=>a.first-b.first||b.last-a.last)){
  let lane=ends.findIndex(last=>last<r.first);
  if(lane===-1)lane=ends.length;
  r.lane=lane;ends[lane]=r.last;
 }
 return {ranges,lanes:ends.length};
}
