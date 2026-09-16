'use client';
import {useCallback,useEffect,useRef,useState} from 'react';
const KEY='leocontigo.voice.v1';
type Settings={voice:string;rate:number};
const defaults:Settings={voice:'auto',rate:.95};
export function rankVoice(voice:Pick<SpeechSynthesisVoice,'name'|'lang'|'localService'>){
  // Provider naming is only a preference hint, not a guarantee of sound quality.
  let score=/natural|neural|premium|enhanced/i.test(voice.name)?100:0;
  if(/google/i.test(voice.name))score+=55;
  if(!voice.localService)score+=15;
  if(/^es[-_](DO|MX|US|419|CO|AR|CL|PE|VE)/i.test(voice.lang))score+=25;
  return score;
}
export function useReadingVoice(){
  const [voices,setVoices]=useState<SpeechSynthesisVoice[]>([]);
  const [settings,setSettings]=useState<Settings>(defaults);
  const [status,setStatus]=useState(''),[speaking,setSpeaking]=useState(false);
  const [supported,setSupported]=useState(true),[ready,setReady]=useState(false);
  const serial=useRef(0),utterance=useRef<SpeechSynthesisUtterance|null>(null);
  const current=useRef<Settings>(defaults);
  const refresh=useCallback(()=>{
    if(typeof window==='undefined'||!('speechSynthesis' in window))return [];
    const list=window.speechSynthesis.getVoices().filter(v=>/^es(?:[-_]|$)/i.test(v.lang)).sort((a,b)=>rankVoice(b)-rankVoice(a)||a.name.localeCompare(b.name));
    setVoices(list);return list;
  },[]);
  const stop=useCallback(()=>{
    serial.current++;if(typeof window!=='undefined'&&'speechSynthesis' in window)window.speechSynthesis.cancel();utterance.current=null;setSpeaking(false);
  },[]);
  useEffect(()=>{
    const ok='speechSynthesis' in window;setSupported(ok);
    try{const parsed=JSON.parse(localStorage.getItem(KEY)||'null');if(parsed&&typeof parsed.voice==='string'&&typeof parsed.rate==='number'&&Number.isFinite(parsed.rate)){const s={voice:parsed.voice,rate:Math.min(1.1,Math.max(.75,parsed.rate))};current.current=s;setSettings(s);}}catch{/* Preferences are optional when browser storage is unavailable. */}
    setReady(true);
    if(!ok){setStatus('Este navegador no dispone de lectura en voz alta.');return;}
    refresh();window.speechSynthesis.addEventListener('voiceschanged',refresh);
    return ()=>{window.speechSynthesis.removeEventListener('voiceschanged',refresh);serial.current++;window.speechSynthesis.cancel();utterance.current=null;};
  },[refresh]);
  function configure(change:Partial<Settings>){
    stop();const next={...current.current,...change};current.current=next;setSettings(next);setStatus('');
    try{localStorage.setItem(KEY,JSON.stringify(next));}catch{setStatus('Puedes probar esta voz, pero el navegador no permite guardar la preferencia.');}
  }
  async function speak(text:string,onEnd?:()=>void){
    if(!('speechSynthesis' in window)){setStatus('Este navegador no dispone de lectura en voz alta.');return;}
    stop();const request=serial.current;setStatus('');
    let list=refresh();
    if(!list.length){
      setStatus('Buscando las voces en español…');
      list=await new Promise<SpeechSynthesisVoice[]>(resolve=>{
        const synth=window.speechSynthesis;
        const finish=()=>{clearTimeout(timer);synth.removeEventListener('voiceschanged',changed);resolve(refresh());};
        const changed=()=>{if(synth.getVoices().some(v=>/^es(?:[-_]|$)/i.test(v.lang)))finish();};
        const timer=setTimeout(finish,1800);synth.addEventListener('voiceschanged',changed);
      });
    }
    if(request!==serial.current)return;
    const voice=list.find(v=>v.voiceURI===current.current.voice)||list[0];
    if(!voice){setStatus('No encontramos una voz en español. Activa una voz en español en tu dispositivo y pulsa «Buscar voces».');return;}
    const speech=new SpeechSynthesisUtterance(text);
    speech.voice=voice;speech.lang=voice.lang;speech.rate=current.current.rate;speech.pitch=1;speech.volume=1;
    utterance.current=speech;setStatus('');setSpeaking(true);
    speech.onend=()=>{if(request!==serial.current)return;setSpeaking(false);utterance.current=null;onEnd?.();};
    speech.onerror=e=>{if(request!==serial.current)return;setSpeaking(false);utterance.current=null;if(e.error!=='canceled'&&e.error!=='interrupted')setStatus('No pudimos reproducir esta voz. Prueba otra en «Para la familia → Voz de lectura».');};
    try{window.speechSynthesis.resume();window.speechSynthesis.speak(speech);}catch{setSpeaking(false);utterance.current=null;setStatus('No se pudo iniciar la voz. Elige otra e inténtalo de nuevo.');}
  }
  const chosen=voices.find(v=>v.voiceURI===settings.voice)||voices[0];
  return {voices,settings,status,speaking,supported,ready,chosen,configure,refresh,speak,stop};
}
