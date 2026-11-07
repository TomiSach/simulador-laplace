import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function PidSimulator() {
  const SETPOINT = 20; 
  const MAX_HISTORY = 50; 
  
  const [kp, setKp] = useState(1.0);
  const [ki, setKi] = useState(0.5);
  const [kd, setKd] = useState(0.0);

  const [isRunning, setIsRunning] = useState(false);
  const [isCrashed, setIsCrashed] = useState(false);
  const [data, setData] = useState(Array(MAX_HISTORY).fill({ time: 0, cpu: 10 })); 
  
  const integral = useRef(0);
  const prevError = useRef(0);
  const timeTick = useRef(0);
  const currentCpu = useRef(10);

  useEffect(() => {
    let interval;
    if (isRunning && !isCrashed) {
      interval = setInterval(() => {
        timeTick.current += 1;

        let error = SETPOINT - currentCpu.current;
        integral.current += error;
        let derivative = error - prevError.current;
        prevError.current = error;

        let controlSignal = (kp * error) + (ki * integral.current) + (kd * derivative);
        let inercia = controlSignal * 0.15; 
        currentCpu.current = currentCpu.current + inercia;

        if (Math.random() > 0.90) {
          currentCpu.current += Math.random() * 8; 
        }

        if (currentCpu.current < 0) currentCpu.current = 0;
        
        if (currentCpu.current >= 100) {
          currentCpu.current = 100;
          setIsCrashed(true);
          setIsRunning(false);
        }

        setData(prevData => {
          const newData = [...prevData.slice(1), { time: timeTick.current, cpu: parseFloat(currentCpu.current.toFixed(1)) }];
          return newData;
        });

      }, 100); 
    }
    return () => clearInterval(interval);
  }, [isRunning, isCrashed, kp, ki, kd]);

  const handleReset = () => {
    setIsRunning(false);
    setIsCrashed(false);
    integral.current = 0;
    prevError.current = 0;
    timeTick.current = 0;
    currentCpu.current = 10;
    setData(Array(MAX_HISTORY).fill({ time: 0, cpu: 10 }));
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 md:p-6 shadow-2xl relative overflow-hidden">
      {isCrashed && (
        <div className="absolute inset-0 z-50 bg-red-900/90 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-sm">
          <h2 className="text-4xl font-black mb-2 tracking-widest">SYSTEM CRASH</h2>
          <p className="text-red-200 mb-6 font-mono text-lg">Inestabilidad detectada. Polos con parte real positiva.</p>
          <button onClick={handleReset} className="bg-white text-red-900 font-bold px-6 py-2 rounded shadow hover:bg-slate-200 transition">Reiniciar Sistema</button>
        </div>
      )}

      <div className="h-64 md:h-80 w-full mb-8 bg-slate-900/50 rounded-lg p-2 border border-slate-700">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 100]} stroke="#94a3b8" />
            <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#10b981' }} itemStyle={{ color: '#10b981' }} labelStyle={{ display: 'none' }} />
            <ReferenceLine y={SETPOINT} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'top', value: 'Meta (20%)', fill: '#f59e0b', fontSize: 12 }} />
            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" />
            <Line type="monotone" dataKey="cpu" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 bg-slate-900/30 p-4 rounded-lg border border-slate-700/50">
        <div className="flex flex-col">
          <label className="text-slate-300 font-mono text-sm mb-2 flex justify-between"><span>Proporcional (Kp)</span><span className="text-emerald-400 font-bold">{kp}</span></label>
          <input type="range" min="0" max="3" step="0.1" value={kp} onChange={(e) => setKp(parseFloat(e.target.value))} className="accent-emerald-500" disabled={isRunning} />
        </div>
        <div className="flex flex-col">
          <label className="text-slate-300 font-mono text-sm mb-2 flex justify-between"><span>Integral (Ki)</span><span className="text-emerald-400 font-bold">{ki}</span></label>
          <input type="range" min="0" max="8" step="0.5" value={ki} onChange={(e) => setKi(parseFloat(e.target.value))} className="accent-emerald-500" disabled={isRunning} />
        </div>
        <div className="flex flex-col">
          <label className="text-slate-300 font-mono text-sm mb-2 flex justify-between"><span>Derivativo (Kd)</span><span className="text-emerald-400 font-bold">{kd}</span></label>
          <input type="range" min="0" max="2" step="0.1" value={kd} onChange={(e) => setKd(parseFloat(e.target.value))} className="accent-emerald-500" disabled={isRunning} />
        </div>
      </div>

      <div className="flex justify-center gap-4">
        {!isRunning ? (
          <button onClick={() => setIsRunning(true)} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-8 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all font-mono tracking-wide">▶ INICIAR ESCANEO</button>
        ) : (
          <button onClick={() => setIsRunning(false)} className="bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-8 rounded-lg transition-all font-mono tracking-wide">⏸ PAUSAR</button>
        )}
        <button onClick={handleReset} className="bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 font-bold py-3 px-6 rounded-lg transition-all">Reset</button>
      </div>
    </div>
  );
}