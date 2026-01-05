import React, { useState, useEffect, useRef, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function RutherfordCollision() {
  const [m1, setM1] = useState(4);
  const [m2, setM2] = useState(197);
  const [v1_init, setV1Init] = useState(15);
  const [collisionType, setCollisionType] = useState('elastic');
  const [isRunning, setIsRunning] = useState(false);
  const [hasCollided, setHasCollided] = useState(false);
  const animationRef = useRef(null);
  const [pos1, setPos1] = useState(15);
  const [pos2, setPos2] = useState(75);
  const vel1Ref = useRef(0);
  const vel2Ref = useRef(0);
  const hasCollidedRef = useRef(false);
  const posRef = useRef({ pos1: 15, pos2: 75 });
  
  const v1_elastic = ((m1 - m2) / (m1 + m2)) * v1_init;
  const v2_elastic = (2 * m1 / (m1 + m2)) * v1_init;
  const v_inelastic = (m1 * v1_init) / (m1 + m2);
  
  const size1 = Math.max(28, Math.min(50, 20 + Math.pow(m1, 1/3) * 4));
  const size2 = Math.max(28, Math.min(75, 20 + Math.pow(m2, 1/3) * 4));
  
  const E_kin_before = 0.5 * m1 * v1_init * v1_init;
  const E_kin_after_elastic = 0.5 * m1 * v1_elastic * v1_elastic + 0.5 * m2 * v2_elastic * v2_elastic;
  const E_kin_after_inelastic = 0.5 * (m1 + m2) * v_inelastic * v_inelastic;
  const E_kin_after = collisionType === 'elastic' ? E_kin_after_elastic : E_kin_after_inelastic;
  const energyLossPercent = ((E_kin_before - E_kin_after) / E_kin_before) * 100;
  
  const p_before = m1 * v1_init;
  const p_after = collisionType === 'elastic' ? m1 * v1_elastic + m2 * v2_elastic : (m1 + m2) * v_inelastic;

  const resetAnimation = useCallback(() => {
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setIsRunning(false);
    setHasCollided(false);
    hasCollidedRef.current = false;
    setPos1(15);
    setPos2(75);
    posRef.current = { pos1: 15, pos2: 75 };
    vel1Ref.current = 0;
    vel2Ref.current = 0;
  }, []);
  
  const startAnimation = () => {
    resetAnimation();
    setTimeout(() => {
      vel1Ref.current = 0.25;
      vel2Ref.current = 0;
      hasCollidedRef.current = false;
      posRef.current = { pos1: 15, pos2: 75 };
      setIsRunning(true);
    }, 50);
  };
  
  useEffect(() => {
    if (!isRunning) return;
    let lastTime = performance.now();
    
    const animate = (currentTime) => {
      const deltaTime = Math.min(currentTime - lastTime, 50);
      lastTime = currentTime;
      const timeScale = deltaTime / 16;
      
      let { pos1: currentPos1, pos2: currentPos2 } = posRef.current;
      currentPos1 += vel1Ref.current * timeScale;
      currentPos2 += vel2Ref.current * timeScale;
      
      const minDistance = (size1 / 8 + size2 / 8) / 2;
      const distance = currentPos2 - currentPos1;
      
      if (!hasCollidedRef.current && distance <= minDistance && vel1Ref.current > vel2Ref.current) {
        hasCollidedRef.current = true;
        setHasCollided(true);
        const speedRatio = 0.25 / v1_init;
        
        if (collisionType === 'elastic') {
          vel1Ref.current = v1_elastic * speedRatio;
          vel2Ref.current = v2_elastic * speedRatio;
        } else {
          vel1Ref.current = v_inelastic * speedRatio;
          vel2Ref.current = v_inelastic * speedRatio;
        }
        
        const overlap = minDistance - distance;
        if (overlap > 0) {
          currentPos1 -= overlap * 0.5;
          currentPos2 += overlap * 0.5;
        }
      }
      
      if (hasCollidedRef.current && collisionType === 'inelastic') {
        const centerPos = (currentPos1 + currentPos2) / 2;
        currentPos1 = centerPos - minDistance * 0.1;
        currentPos2 = centerPos + minDistance * 0.1;
      }
      
      posRef.current = { pos1: currentPos1, pos2: currentPos2 };
      setPos1(currentPos1);
      setPos2(currentPos2);
      
      if (((currentPos1 < -15 && vel1Ref.current < 0) || currentPos2 > 110 || currentPos1 > 110) && hasCollidedRef.current) {
        setIsRunning(false);
        return;
      }
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animationRef.current = requestAnimationFrame(animate);
    return () => { if (animationRef.current) cancelAnimationFrame(animationRef.current); };
  }, [isRunning, collisionType, v1_elastic, v2_elastic, v_inelastic, v1_init, size1, size2]);
  
  useEffect(() => { resetAnimation(); }, [m1, m2, v1_init, collisionType, resetAnimation]);
  
  const generateGraphData = () => {
    const data = [];
    for (let ratio = 0.01; ratio <= 10; ratio += 0.1) {
      const m2_temp = m1 * ratio;
      const v2_el = (2 * m1 / (m1 + m2_temp)) * v1_init;
      const E_transfer_el = (0.5 * m2_temp * v2_el * v2_el) / E_kin_before * 100;
      const v_inel = (m1 * v1_init) / (m1 + m2_temp);
      const E_after_inel = 0.5 * (m1 + m2_temp) * v_inel * v_inel;
      const E_loss_inel = ((E_kin_before - E_after_inel) / E_kin_before) * 100;
      data.push({ ratio, E_transfer_elastic: E_transfer_el, E_loss_inelastic: E_loss_inel });
    }
    return data;
  };
  
  const graphData = generateGraphData();
  const currentRatio = m2 / m1;
  
  const presets = [
    { name: 'α + Au', m1: 4, m2: 197 },
    { name: 'Ens', m1: 4, m2: 4 },
    { name: 'Tung→Let', m1: 197, m2: 4 },
    { name: 'p + p', m1: 1, m2: 1 },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 p-3">
      <div className="max-w-5xl mx-auto">
        {/* Titel + kontroller */}
        <div className="flex flex-wrap items-center justify-between mb-3">
          <h1 className="text-xl font-bold">Stød mellem partikler</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setCollisionType('elastic')}
              className={`px-3 py-1 rounded font-medium text-sm ${collisionType === 'elastic' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}>
              Elastisk
            </button>
            <button onClick={() => setCollisionType('inelastic')}
              className={`px-3 py-1 rounded font-medium text-sm ${collisionType === 'inelastic' ? 'bg-orange-600 text-white' : 'bg-gray-200'}`}>
              Uelastisk
            </button>
            <span className="text-gray-300 mx-1">|</span>
            {presets.map((p, i) => (
              <button key={i} onClick={() => { setM1(p.m1); setM2(p.m2); }}
                className={`px-2 py-1 rounded text-xs ${m1 === p.m1 && m2 === p.m2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {p.name}
              </button>
            ))}
          </div>
        </div>
        
        {/* Sliders + Animation side by side */}
        <div className="flex gap-3 mb-3">
          {/* Sliders */}
          <div className="bg-white rounded-lg p-3 border shadow-sm w-40 flex-shrink-0 space-y-3">
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>m₁</span><span className="text-orange-600 font-bold">{m1} u</span>
              </div>
              <input type="range" min="1" max="250" value={m1} onChange={(e) => setM1(Number(e.target.value))} className="w-full h-1.5 accent-orange-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>m₂</span><span className="text-yellow-600 font-bold">{m2} u</span>
              </div>
              <input type="range" min="1" max="250" value={m2} onChange={(e) => setM2(Number(e.target.value))} className="w-full h-1.5 accent-yellow-500" />
            </div>
            <div>
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>v₀</span><span className="text-green-600 font-bold">{v1_init}×10⁶</span>
              </div>
              <input type="range" min="1" max="30" value={v1_init} onChange={(e) => setV1Init(Number(e.target.value))} className="w-full h-1.5 accent-green-500" />
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <button onClick={startAnimation} disabled={isRunning}
                className={`flex-1 py-1.5 rounded text-xs font-medium ${isRunning ? 'bg-gray-300' : 'bg-green-600 text-white'}`}>
                Start
              </button>
              <button onClick={resetAnimation} className="flex-1 py-1.5 bg-gray-200 rounded text-xs font-medium">
                Nulstil
              </button>
            </div>
          </div>
          
          {/* Animation */}
          <div className="bg-white rounded-lg p-2 border shadow-sm flex-1">
            <div className="relative h-40 bg-gray-100 rounded overflow-hidden border">
              <div className="absolute inset-0 opacity-20">
                {[...Array(11)].map((_, i) => (
                  <div key={i} className="absolute top-0 bottom-0 border-l border-gray-300" style={{ left: `${i * 10}%` }} />
                ))}
              </div>
              
              {/* Partikel 1 */}
              <div className="absolute top-1/2 rounded-full flex items-center justify-center border-2 border-orange-700"
                style={{
                  left: `${pos1}%`, width: size1, height: size1,
                  transform: 'translate(-50%, -50%)',
                  background: 'radial-gradient(circle at 35% 35%, #fdba74, #ea580c)',
                  zIndex: 20,
                }}>
                <span className="text-white font-bold" style={{ fontSize: size1 * 0.35 }}>
                  {m1 === 4 ? 'α' : m1 === 1 ? 'p' : 'm₁'}
                </span>
              </div>
              
              {/* Partikel 2 */}
              <div className="absolute top-1/2 rounded-full flex items-center justify-center border-2"
                style={{
                  left: `${pos2}%`, width: size2, height: size2,
                  transform: 'translate(-50%, -50%)',
                  background: collisionType === 'inelastic' && hasCollided
                    ? 'radial-gradient(circle at 35% 35%, #fcd34d, #dc2626)'
                    : 'radial-gradient(circle at 35% 35%, #fef08a, #eab308)',
                  borderColor: collisionType === 'inelastic' && hasCollided ? '#b91c1c' : '#a16207',
                  zIndex: 10,
                }}>
                <span className="text-gray-800 font-bold" style={{ fontSize: size2 * 0.28 }}>
                  {collisionType === 'inelastic' && hasCollided ? `${m1}+${m2}` 
                    : (m2 === 197 ? 'Au' : m2 === 12 ? 'C' : m2 === 4 ? 'α' : m2 === 1 ? 'p' : 'm₂')}
                </span>
              </div>
              
              {/* Hastighedspile */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker id="aG" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L0,8 L8,4 z" fill="#16a34a" />
                  </marker>
                  <marker id="aR" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L0,8 L8,4 z" fill="#dc2626" />
                  </marker>
                  <marker id="aO" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
                    <path d="M0,0 L0,8 L8,4 z" fill="#d97706" />
                  </marker>
                </defs>
                
                {!hasCollided && isRunning && (
                  <g>
                    <line x1={`${pos1 + 4}%`} y1="28%" x2={`${pos1 + 16}%`} y2="28%" stroke="#16a34a" strokeWidth="2" markerEnd="url(#aG)" />
                    <text x={`${pos1 + 10}%`} y="20%" fill="#16a34a" fontSize="11" textAnchor="middle" fontWeight="bold">
                      v₀ = {v1_init}×10⁶ m/s
                    </text>
                  </g>
                )}
                
                {hasCollided && collisionType === 'elastic' && (
                  <>
                    {Math.abs(v1_elastic) > 0.5 && pos1 > 2 && pos1 < 98 && (
                      v1_elastic >= 0 ? (
                        <g>
                          <line x1={`${pos1}%`} y1="28%" x2={`${pos1 + 10}%`} y2="28%" stroke="#16a34a" strokeWidth="2" markerEnd="url(#aG)" />
                          <text x={`${pos1 + 5}%`} y="18%" fill="#16a34a" fontSize="10" textAnchor="middle" fontWeight="bold">v₁={v1_elastic.toFixed(1)}</text>
                        </g>
                      ) : (
                        <g>
                          <line x1={`${pos1}%`} y1="28%" x2={`${pos1 - 10}%`} y2="28%" stroke="#dc2626" strokeWidth="2" markerEnd="url(#aR)" />
                          <text x={`${pos1 - 5}%`} y="18%" fill="#dc2626" fontSize="10" textAnchor="middle" fontWeight="bold">v₁={v1_elastic.toFixed(1)}</text>
                        </g>
                      )
                    )}
                    {v2_elastic > 0.5 && pos2 < 95 && (
                      <g>
                        <line x1={`${pos2}%`} y1="28%" x2={`${Math.min(98, pos2 + 10)}%`} y2="28%" stroke="#16a34a" strokeWidth="2" markerEnd="url(#aG)" />
                        <text x={`${Math.min(93, pos2 + 5)}%`} y="18%" fill="#16a34a" fontSize="10" textAnchor="middle" fontWeight="bold">v₂={v2_elastic.toFixed(1)}</text>
                      </g>
                    )}
                  </>
                )}
                
                {hasCollided && collisionType === 'inelastic' && pos2 < 95 && (
                  <g>
                    <line x1={`${(pos1 + pos2) / 2}%`} y1="28%" x2={`${(pos1 + pos2) / 2 + 10}%`} y2="28%" stroke="#d97706" strokeWidth="2" markerEnd="url(#aO)" />
                    <text x={`${(pos1 + pos2) / 2 + 5}%`} y="18%" fill="#d97706" fontSize="10" textAnchor="middle" fontWeight="bold">v={v_inelastic.toFixed(1)}</text>
                  </g>
                )}
              </svg>
              
              <div className={`absolute top-1 right-1 px-2 py-0.5 rounded text-xs font-bold ${
                collisionType === 'elastic' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                {collisionType === 'elastic' ? 'ELASTISK' : 'UELASTISK'}
              </div>
            </div>
          </div>
        </div>
        
        {/* Resultater + Graf side by side */}
        <div className="flex gap-3 mb-3">
          {/* Resultater */}
          <div className="bg-white rounded-lg p-3 border shadow-sm w-64 flex-shrink-0 text-xs">
            <div className="font-semibold text-gray-700 mb-2">Resultater</div>
            {collisionType === 'elastic' ? (
              <div className="space-y-1 font-mono">
                <div>v₁ = <span className={v1_elastic >= 0 ? 'text-green-600' : 'text-red-600'}>{v1_elastic.toFixed(2)}</span> × 10⁶ m/s</div>
                <div>v₂ = <span className="text-green-600">{v2_elastic.toFixed(2)}</span> × 10⁶ m/s</div>
                <div className="pt-1 border-t text-gray-600">Overført til m₂: <span className="text-green-600 font-bold">{((0.5 * m2 * v2_elastic * v2_elastic) / E_kin_before * 100).toFixed(1)}%</span></div>
              </div>
            ) : (
              <div className="space-y-1 font-mono">
                <div>v = <span className="text-orange-600">{v_inelastic.toFixed(2)}</span> × 10⁶ m/s</div>
                <div className="pt-1 border-t text-gray-600">Energitab: <span className="text-red-600 font-bold">{energyLossPercent.toFixed(1)}%</span></div>
              </div>
            )}
            <div className="mt-2 pt-2 border-t text-gray-500">
              <div>Impuls: {p_before.toFixed(1)} = {p_after.toFixed(1)} <span className="text-green-600">OK</span></div>
              <div>Energi: {E_kin_before.toFixed(1)} → {E_kin_after.toFixed(1)} {collisionType === 'elastic' ? <span className="text-green-600">OK</span> : <span className="text-orange-600">−{energyLossPercent.toFixed(0)}%</span>}</div>
            </div>
            
            {/* Kompakt formelsamling */}
            <div className="mt-3 pt-2 border-t">
              <div className="text-gray-500 mb-1">Formler:</div>
              {collisionType === 'elastic' ? (
                <div className="font-mono text-gray-600 space-y-0.5">
                  <div>v₁ = (m₁−m₂)/(m₁+m₂)·v₀</div>
                  <div>v₂ = 2m₁/(m₁+m₂)·v₀</div>
                </div>
              ) : (
                <div className="font-mono text-gray-600 space-y-0.5">
                  <div>v = m₁/(m₁+m₂)·v₀</div>
                  <div>ΔE = ½·m₁m₂/(m₁+m₂)·v₀²</div>
                </div>
              )}
            </div>
          </div>
          
          {/* Graf */}
          <div className="bg-white rounded-lg p-3 border shadow-sm flex-1">
            <div className="text-xs font-semibold text-gray-700 mb-1">Energi vs. masseforhold (m₂/m₁)</div>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={graphData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="ratio" stroke="#9ca3af" tick={{ fontSize: 9 }} tickFormatter={(v) => v.toFixed(0)} />
                <YAxis stroke="#9ca3af" tick={{ fontSize: 9 }} domain={[0, 100]} unit="%" />
                <Tooltip contentStyle={{ fontSize: 10 }} formatter={(v) => `${v.toFixed(1)}%`} />
                <ReferenceLine x={currentRatio} stroke="#f59e0b" strokeWidth={2} strokeDasharray="4 2" />
                <ReferenceLine x={1} stroke="#d1d5db" strokeDasharray="2 2" />
                <Line type="monotone" dataKey="E_transfer_elastic" stroke="#16a34a" name="Overført (elastisk)" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="E_loss_inelastic" stroke="#dc2626" name="Tabt (uelastisk)" dot={false} strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex justify-center gap-4 text-xs mt-1">
              <span><span className="inline-block w-3 h-0.5 bg-green-600 mr-1"></span>Overført (elastisk)</span>
              <span><span className="inline-block w-3 h-0.5 bg-red-600 mr-1"></span>Tabt (uelastisk)</span>
              <span><span className="inline-block w-3 h-0.5 bg-yellow-500 mr-1"></span>Aktuelt m₂/m₁</span>
            </div>
          </div>
        </div>
        
        <p className="text-center text-gray-400 text-xs">Fysik A - Impuls og stød</p>
      </div>
    </div>
  );
}
