"use client";

import {useEffect,useRef,useState,type CSSProperties,type ReactNode} from "react";

export function Reveal({children,className="",visibleClass,delay=0}:{children:ReactNode;className?:string;visibleClass:string;delay?:number}){
 const ref=useRef<HTMLDivElement>(null),[visible,setVisible]=useState(false);
 useEffect(()=>{const node=ref.current;if(!node)return;const observer=new IntersectionObserver(([entry])=>{if(entry.isIntersecting){setVisible(true);observer.disconnect()}},{threshold:.01,rootMargin:"0px 0px -4%"});observer.observe(node);return()=>observer.disconnect()},[]);
 return <div ref={ref} className={`${className} ${visible?visibleClass:""}`} style={{"--reveal-delay":`${delay}ms`} as CSSProperties}>{children}</div>;
}

export function FreedomCount({value}:{value:number}){
 const ref=useRef<HTMLSpanElement>(null),[display,setDisplay]=useState(value),played=useRef(false);
 useEffect(()=>{const node=ref.current;if(!node||window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;const observer=new IntersectionObserver(([entry])=>{if(!entry.isIntersecting||played.current)return;played.current=true;observer.disconnect();const start=Math.round(value*.82),started=performance.now(),duration=850;const tick=(now:number)=>{const progress=Math.min(1,(now-started)/duration),eased=1-Math.pow(1-progress,3);setDisplay(Math.round(start+(value-start)*eased));if(progress<1)requestAnimationFrame(tick)};setDisplay(start);requestAnimationFrame(tick)},{threshold:.45});observer.observe(node);return()=>observer.disconnect()},[value]);
 return <span ref={ref} aria-label={`₹${new Intl.NumberFormat("en-IN").format(value)}`}>₹{new Intl.NumberFormat("en-IN").format(display)}</span>;
}
