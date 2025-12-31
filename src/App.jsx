import React, { useState, useEffect } from 'react';
import { Activity, Heart, AlertCircle, CheckCircle, Flame, Calendar, Info } from 'lucide-react';

const CKDTracker = () => {
  // --- State ---
  const [logs, setLogs] = useState({});
  const [streak, setStreak] = useState(0);
  const [showInfo, setShowInfo] = useState(false);

  // --- Configuration ---
  const EXERCISES = [
    { id: 'warmup_rotation', label: 'Shoulder Rotations', phase: 'Warm-Up', duration: '2-3 mins' },
    { id: 'warmup_walk', label: 'Gentle Walk in Place', phase: 'Warm-Up', duration: '2-3 mins' },
    { id: 'main_walk', label: 'Brisk Walk (Talk Test)', phase: 'Main Phase', duration: '10-30 mins' },
    { id: 'main_strength', label: 'Seated Leg Lifts / Wall Push-ups', phase: 'Main Phase', duration: '1 set (10-15 reps)' },
    { id: 'cool_stretch', label: 'Leg Stretches', phase: 'Cool-Down', duration: '3-5 mins' },
    { id: 'cool_breathe', label: 'Deep Breathing', phase: 'Cool-Down', duration: '2 mins' },
  ];

  // --- Helpers ---
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  const getPastDate = (daysAgo) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  // --- Effects ---
  // Load data on mount
  useEffect(() => {
    const savedLogs = localStorage.getItem('ckd_tracker_logs');
    if (savedLogs) {
      setLogs(JSON.parse(savedLogs));
    }
  }, []);

  // Save data and calc streak whenever logs change
  useEffect(() => {
    localStorage.setItem('ckd_tracker_logs', JSON.stringify(logs));
    calculateStreak();
  }, [logs]);

  // --- Logic ---
  const toggleExercise = (id) => {
    const today = getTodayDate();
    const todayLog = logs[today] || [];
    
    let newTodayLog;
    if (todayLog.includes(id)) {
      newTodayLog = todayLog.filter(exId => exId !== id);
    } else {
      newTodayLog = [...todayLog, id];
    }

    setLogs({
      ...logs,
      [today]: newTodayLog
    });
  };

  const calculateStreak = () => {
    let currentStreak = 0;
    // Check today
    const today = getTodayDate();
    if (logs[today] && logs[today].length > 0) {
      currentStreak++;
    }

    // Check past days
    let dayOffset = 1;
    while (true) {
      const dateStr = getPastDate(dayOffset);
      const dayLog = logs[dateStr];
      
      // We count a day towards streak if at least 1 exercise was done
      if (dayLog && dayLog.length > 0) {
        currentStreak++;
        dayOffset++;
      } else {
        // If today is empty, don't break streak immediately, check yesterday.
        // But if we are looking at yesterday (offset 1) and it's empty, streak breaks.
        // Note: The logic above already added today if active. 
        // If today is inactive, we shouldn't count it, but we should look at yesterday.
        // If today is active, we look at yesterday.
        
        // Refined logic:
        // A streak is unbroken sequence of days with activity.
        // If today has activity, we count backwards from yesterday.
        // If today has NO activity, we count backwards from yesterday (streak is preserved if yesterday was active).
        break;
      }
    }
    
    // Correction for "streak continues if today is skipped but yesterday was done" logic often used in apps:
    // This simple logic just counts total consecutive days including today if active.
    // If today is not active, but yesterday was, we might want to show yesterday's streak.
    // Let's stick to a strict "days in a row ending today or yesterday" logic.
    
    let count = 0;
    let checkDate = new Date();
    
    // Check up to 365 days back
    let gapFound = false;
    
    // First, check if today is done
    if (logs[getTodayDate()]?.length > 0) {
        count = 1;
    } 
    
    // Check yesterday backwards
    for (let i = 1; i < 365; i++) {
        const d = getPastDate(i);
        if (logs[d] && logs[d].length > 0) {
            if (!gapFound) {
                if (i === 1 && count === 0) {
                    // Today not done, but yesterday done. Streak is alive.
                    count = 1; 
                } else {
                    count++;
                }
            }
        } else {
             // If we hit a gap
             gapFound = true;
             break;
        }
    }
    setStreak(count);
  };

  const isCompleted = (id) => {
    const today = getTodayDate();
    return logs[today]?.includes(id);
  };

  const getProgress = () => {
    const today = getTodayDate();
    const completedCount = logs[today]?.length || 0;
    return Math.round((completedCount / EXERCISES.length) * 100);
  };

  // --- Render Helpers ---
  const renderPhase = (phaseName, colorClass, bgClass) => {
    const phaseExercises = EXERCISES.filter(e => e.phase === phaseName);
    
    return (
      <div className={`mb-6 rounded-xl overflow-hidden border border-slate-100 shadow-sm`}>
        <div className={`px-4 py-2 ${bgClass} border-b border-slate-100 flex items-center gap-2`}>
          <div className={`w-2 h-8 rounded-full ${colorClass}`}></div>
          <h3 className="font-semibold text-slate-700">{phaseName}</h3>
        </div>
        <div className="bg-white divide-y divide-slate-50">
          {phaseExercises.map(ex => (
            <div 
              key={ex.id} 
              onClick={() => toggleExercise(ex.id)}
              className="p-4 flex items-center justify-between cursor-pointer active:bg-slate-50 transition-colors"
            >
              <div className="flex-1">
                <p className={`font-medium text-lg ${isCompleted(ex.id) ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                  {ex.label}
                </p>
                <p className="text-sm text-slate-500">{ex.duration}</p>
              </div>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${isCompleted(ex.id) ? `bg-green-500 border-green-500` : 'border-slate-300 bg-white'}`}>
                {isCompleted(ex.id) && <CheckCircle size={20} className="text-white" />}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans">
      {/* Header */}
      <div className="bg-white p-6 shadow-sm sticky top-0 z-10">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Activity className="text-blue-600" />
              CKD Active
            </h1>
            <p className="text-slate-500 text-sm">Slow & Steady Wins.</p>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
              <Flame className="text-orange-500" size={18} fill={streak > 0 ? "currentColor" : "none"} />
              <span className="font-bold text-orange-700">{streak} Day Streak</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
          <div 
            className="bg-blue-600 h-full transition-all duration-500 ease-out"
            style={{ width: `${getProgress()}%` }}
          ></div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4">
        
        {/* Safety Card */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="text-blue-600 shrink-0 mt-1" size={24} />
            <div>
              <h2 className="font-semibold text-blue-900 mb-1">Safety First</h2>
              <ul className="text-sm text-blue-800 space-y-1 list-disc pl-4">
                <li><strong>The Talk Test:</strong> If you can't speak comfortably while moving, slow down.</li>
                <li><strong>Stop if:</strong> You feel dizzy, chest pain, or nausea.</li>
                <li><strong>Hydration:</strong> Stick to your fluid limits.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Exercise List */}
        {renderPhase('Warm-Up', 'bg-yellow-400', 'bg-yellow-50')}
        {renderPhase('Main Phase', 'bg-blue-500', 'bg-blue-50')}
        {renderPhase('Cool-Down', 'bg-purple-400', 'bg-purple-50')}

        {/* Weekly View (History) */}
        <div className="mt-8">
          <h3 className="text-lg font-bold text-slate-700 mb-3 flex items-center gap-2">
            <Calendar size={20} />
            Last 7 Days
          </h3>
          <div className="flex justify-between gap-2">
            {[...Array(7)].map((_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (6 - i));
              const dateStr = d.toISOString().split('T')[0];
              const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
              const isDone = logs[dateStr] && logs[dateStr].length > 0;
              const isToday = dateStr === getTodayDate();

              return (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div className={`
                    w-full aspect-square rounded-lg flex items-center justify-center mb-1 transition-all
                    ${isDone ? 'bg-green-500 text-white shadow-sm' : 'bg-slate-200 text-slate-400'}
                    ${isToday ? 'ring-2 ring-offset-2 ring-blue-500' : ''}
                  `}>
                    {isDone && <CheckCircle size={16} />}
                  </div>
                  <span className="text-xs text-slate-500 font-medium">{dayName[0]}</span>
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="mt-8 p-4 bg-slate-100 rounded-lg text-xs text-slate-500 text-center">
            <p className="flex items-center justify-center gap-2 mb-2">
                <Info size={14} />
                <span>Disclaimer</span>
            </p>
            This tool is for tracking purposes only. Always follow the specific advice of your nephrologist regarding fluid intake and exercise intensity.
        </div>

      </div>
    </div>
  );
};

export default CKDTracker;


