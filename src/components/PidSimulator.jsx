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
  const delayBuffer = useRef([10, 10, 10, 10]); 

  useEffect(() => {
    let interval;
    if (isRunning && !isCrashed) {
      interval = setInterval(() => {
        timeTick.current += 1;

        delayBuffer.current.push(currentCpu.current);
        let delayedCpu = delayBuffer.current.shift();

        let error = SETPOINT - delayedCpu;
        integral.current += error;
        let derivative = error - prevError.current;
        prevError.current = error;

        let controlSignal = (kp * error) + (ki * integral.current) + (kd * derivative);

        let dt = 0.1;
        let tau = 2.0;
        let k_planta = 1.0;
        let dy = dt * ((k_planta * controlSignal) - currentCpu.current) / tau;
        
        currentCpu.current += dy;

        if (Math.random() > 0.95) {
          currentCpu.current += Math.random() * 5; 
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
    delayBuffer.current = [10, 10, 10, 10];
    setData(Array(MAX_HISTORY).fill({ time: 0, cpu: 10 }));
  };

  const injectMalware = () => {
    if (isRunning && !isCrashed) {
      currentCpu.current += 60; 
    }
  };

  // Funciones de Presets para la presentación
  const applyPreset = (newKp, newKi, newKd) => {
    if (!isRunning) {
      setKp(newKp);
      setKi(newKi);
      setKd(newKd);
    }
  };

  return (
    <div className="bg-black/50 backdrop-blur-xl border border-emerald-500/30 rounded-sm p-4 md:p-8 shadow-[0_0_40px_rgba(16,185,129,0.1)] relative overflow-hidden font-mono">
      
      <div className="absolute top-2 left-4 text-emerald-500/20 text-xs tracking-widest pointer-events-none">
        SYS.ANTIVIRUS.PID.v1.0 // MATEMÁTICA_IV
      </div>

      {isCrashed && (
        <div className="absolute inset-0 z-50 bg-red-950/90 flex flex-col items-center justify-center text-white p-6 text-center backdrop-blur-md border-[4px] border-red-600 shadow-[inset_0_0_100px_rgba(220,38,38,0.8)]">
          <h2 className="text-5xl font-black mb-2 tracking-widest text-red-500 drop-shadow-[0_0_15px_rgba(220,38,38,1)]">CRITICAL ERROR</h2>
          <p className="text-red-300 mb-8 font-mono text-xl uppercase tracking-widest">Inestabilidad Detectada: Polos en semiplano derecho.</p>
          <button onClick={handleReset} className="bg-red-600 text-white font-bold px-8 py-3 rounded-none shadow-[0_0_20px_rgba(220,38,38,0.6)] hover:bg-red-500 hover:shadow-[0_0_30px_rgba(220,38,38,1)] transition-all uppercase tracking-widest">
            &gt; Reiniciar Núcleo &lt;
          </button>
        </div>
      )}

      <div className="h-64 md:h-96 w-full mb-6 bg-black/80 p-4 border border-emerald-500/20 relative shadow-[inset_0_0_30px_rgba(16,185,129,0.05)]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="2 4" stroke="#064e3b" vertical={false} />
            <XAxis dataKey="time" hide />
            <YAxis domain={[0, 100]} stroke="#059669" tick={{ fill: '#34d399', fontSize: 12 }} />
            <Tooltip contentStyle={{ backgroundColor: '#022c22', border: '1px solid #10b981', color: '#6ee7b7' }} itemStyle={{ color: '#34d399' }} labelStyle={{ display: 'none' }} />
            <ReferenceLine y={SETPOINT} stroke="#f59e0b" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'OBJETIVO_CPU: 20%', fill: '#f59e0b', fontSize: 12, fontFamily: 'monospace' }} />
            <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'insideTopLeft', value: 'ZONA_CRÍTICA: 80%', fill: '#ef4444', fontSize: 12, fontFamily: 'monospace' }} />
            <Line type="stepAfter" dataKey="cpu" stroke="#10b981" strokeWidth={3} dot={false} isAnimationActive={false} style={{ filter: 'drop-shadow(0px 0px 5px rgba(16,185,129,0.8))' }} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Botones de Escenarios / Presets (Solo se pueden tocar si está pausado) */}
      <div className="mb-6 bg-slate-900/60 p-3 border border-emerald-900/50 flex flex-wrap gap-3 items-center justify-between">
        <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Presets de Demostración:</span>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => applyPreset(1.0, 0.3, 1.0)} disabled={isRunning} className="bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-xs py-2 px-3 border border-emerald-600/60 transition-all disabled:opacity-40">
            🟢 Modo Óptimo
          </button>
          <button onClick={() => applyPreset(1.5, 2.0, 0.0)} disabled={isRunning} className="bg-amber-950/80 hover:bg-amber-900 text-amber-300 text-xs py-2 px-3 border border-amber-600/60 transition-all disabled:opacity-40">
            🟡 Modo Oscilatorio
          </button>
          <button onClick={() => applyPreset(2.0, 8.0, 0.0)} disabled={isRunning} className="bg-red-950/80 hover:bg-red-900 text-red-300 text-xs py-2 px-3 border border-red-600/60 transition-all disabled:opacity-40">
            🔴 Modo Caos (Inestable)
          </button>
        </div>
      </div>

      {/* Controles PID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[ 
          { label: 'PROPORCIONAL (Kp)', val: kp, set: setKp, max: 20, step: 0.5 },
          { label: 'INTEGRAL (Ki)', val: ki, set: setKi, max: 10, step: 0.1 },
          { label: 'DERIVATIVO (Kd)', val: kd, set: setKd, max: 5, step: 0.1 }
        ].map((ctrl, i) => (
          <div key={i} className="flex flex-col bg-black/60 p-5 border border-emerald-900 shadow-[inset_0_0_15px_rgba(16,185,129,0.05)] hover:border-emerald-500/50 transition-colors">
            <label className="text-emerald-500/70 text-xs mb-3 flex justify-between tracking-widest font-bold">
              <span>{ctrl.label}</span>
              <span className="text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]">{ctrl.val.toFixed(1)}</span>
            </label>
            <input type="range" min="0" max={ctrl.max} step={ctrl.step} value={ctrl.val} onChange={(e) => ctrl.set(parseFloat(e.target.value))} className="accent-emerald-500 w-full h-1 bg-gray-800 rounded-none appearance-none cursor-pointer" disabled={isRunning} />
          </div>
        ))}
      </div>

      {/* Botonera Principal */}
      <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-4">
        {!isRunning ? (
          <button onClick={() => setIsRunning(true)} className="bg-emerald-500 text-black font-black py-4 px-10 border border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.5)] hover:shadow-[0_0_25px_rgba(16,185,129,0.9)] hover:bg-emerald-400 transition-all tracking-widest uppercase w-full md:w-auto">
            [ INICIAR ESCANEO ]
          </button>
        ) : (
          <button onClick={() => setIsRunning(false)} className="bg-transparent text-emerald-500 font-black py-4 px-10 border-2 border-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)] hover:bg-emerald-950 transition-all tracking-widest uppercase w-full md:w-auto">
            [ PAUSAR ]
          </button>
        )}
        <button onClick={injectMalware} className="bg-red-950/50 text-red-500 border border-red-800 py-4 px-6 hover:bg-red-900 hover:text-white transition-all tracking-widest uppercase text-sm w-full md:w-auto">
          ⚠ Inyectar Malware
        </button>
        <button onClick={handleReset} className="bg-transparent text-slate-400 border border-slate-700 py-4 px-8 hover:text-white hover:border-slate-500 transition-all tracking-widest uppercase w-full md:w-auto">
          RESET
        </button>
      </div>
    </div>
  );
}