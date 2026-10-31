import React from 'react';
export function Section({title,action='View all',onAction,children}:{title:string;action?:string;onAction?:()=>void;children:React.ReactNode}) {return <section className="panel-section"><div className="section-heading"><h2>{title}</h2>{onAction && <button onClick={onAction}>{action}</button>}</div>{children}</section>;}
