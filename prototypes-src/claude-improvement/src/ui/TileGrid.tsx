import React from 'react';
export function TileGrid({children,columns=3,className=''}:{children:React.ReactNode;columns?:number;className?:string}) {return <div className={'tile-grid '+className} style={{gridTemplateColumns:'repeat('+columns+',minmax(0,1fr))'}}>{children}</div>;}
