// Saturated hues alternate across overlapping lanes. Rails represent composers, not hard
// historical boundaries. A dot, not the presence of a passing line, means membership.
export const eras=[
 ['Contemporary','#b58aff'],['Minimalism','#eaff52'],['Serialism','#ffad38'],
 ['Modern','#479fff'],['Neoclassicism','#88db4a'],['Impressionism','#ff93d8'],
 ['Post-Romanticism','#31ded4'],['Late Romanticism','#ebb778'],['Romantic','#ff627d'],
 ['Classical','#ffdd37'],['Baroque','#37c78e'],['Renaissance','#c7bfff']
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
