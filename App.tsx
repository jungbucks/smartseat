
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Users, 
  Settings, 
  Shuffle, 
  Trash2, 
  Plus, 
  Sparkles, 
  Save, 
  Layout, 
  Lock, 
  Unlock,
  ChevronRight,
  UserMinus,
  UserCheck,
  X,
  RefreshCcw,
  Hash
} from 'lucide-react';
import { Student, Seat } from './types';
import { getSeatingAdvice } from './services/geminiService';

const App: React.FC = () => {
  // State
  const [students, setStudents] = useState<Student[]>([]);
  const [newName, setNewName] = useState('');
  const [bulkCount, setBulkCount] = useState<string>('');
  const [rows, setRows] = useState(5);
  const [cols, setCols] = useState(6);
  const [seats, setSeats] = useState<Seat[]>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'manage' | 'grid'>('grid');

  // Initialize seats when rows/cols change
  useEffect(() => {
    const totalSeats = rows * cols;
    setSeats(prev => {
      const newSeats: Seat[] = Array.from({ length: totalSeats }, (_, i) => ({
        id: i,
        studentId: prev[i]?.studentId || null,
        isBlocked: prev[i]?.isBlocked || false,
      }));
      return newSeats;
    });
  }, [rows, cols]);

  // Handlers
  const addStudent = () => {
    if (!newName.trim()) return;
    const student: Student = {
      id: Math.random().toString(36).substr(2, 9),
      name: newName.trim(),
      isFixed: false,
      isMissing: false
    };
    setStudents([...students, student]);
    setNewName('');
  };

  const generateBulkStudents = () => {
    const count = parseInt(bulkCount);
    if (isNaN(count) || count <= 0) return;
    
    const newStudents: Student[] = Array.from({ length: count }, (_, i) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: `${i + 1}번`,
      isFixed: false,
      isMissing: false
    }));
    setStudents(newStudents);
    setBulkCount('');
  };

  const removeStudent = (id: string) => {
    setStudents(students.filter(s => s.id !== id));
    setSeats(seats.map(seat => seat.studentId === id ? { ...seat, studentId: null } : seat));
  };

  const toggleFixStudent = (id: string) => {
    setStudents(students.map(s => s.id === id ? { ...s, isFixed: !s.isFixed } : s));
  };

  const toggleMissingStudent = (id: string) => {
    setStudents(students.map(s => {
      if (s.id === id) {
        const isNowMissing = !s.isMissing;
        // If becoming missing, it shouldn't be fixed anymore
        return { ...s, isMissing: isNowMissing, isFixed: isNowMissing ? false : s.isFixed };
      }
      return s;
    }));
    // If a student becomes missing, remove them from their current seat
    setSeats(seats.map(seat => {
      const student = students.find(s => s.id === seat.studentId);
      if (student?.id === id && !student.isMissing) {
        return { ...seat, studentId: null };
      }
      return seat;
    }));
  };

  const toggleBlockSeat = (index: number) => {
    setSeats(seats.map((seat, i) => i === index ? { ...seat, isBlocked: !seat.isBlocked, studentId: null } : seat));
  };

  const shuffleSeats = useCallback(() => {
    setIsShuffling(true);
    
    setTimeout(() => {
      // Filter out missing students
      const activeStudents = students.filter(s => !s.isMissing);
      const fixedStudentIds = new Set(activeStudents.filter(s => s.isFixed).map(s => s.id));
      const availableStudents = activeStudents.filter(s => !s.isFixed);
      
      // Shuffle logic
      const shuffledAvailable = [...availableStudents].sort(() => Math.random() - 0.5);
      
      const newSeats = [...seats].map(seat => {
        // If seat is blocked, keep it null
        if (seat.isBlocked) return { ...seat, studentId: null };
        
        // If seat currently holds a fixed student (who is still active), keep them
        if (seat.studentId && fixedStudentIds.has(seat.studentId)) return seat;
        
        // Assign from shuffled list
        const nextStudent = shuffledAvailable.pop();
        return { ...seat, studentId: nextStudent?.id || null };
      });

      setSeats(newSeats);
      setIsShuffling(false);
    }, 800);
  }, [students, seats]);

  const fetchAiAdvice = async () => {
    setIsAiLoading(true);
    const names = students.filter(s => !s.isMissing).map(s => s.name);
    const advice = await getSeatingAdvice(names, `${rows}x${cols} grid`);
    setAiAdvice(advice);
    setIsAiLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Users className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">스마트 자리 바꾸기</h1>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setActiveTab('manage')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'manage' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              학생 관리
            </button>
            <button 
              onClick={() => setActiveTab('grid')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeTab === 'grid' ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              배치도 보기
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Management & Stats */}
        <div className="lg:col-span-4 space-y-6">
          <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Hash className="w-5 h-5 text-indigo-600" />
                학번 일괄 생성
              </h2>
              <div className="flex gap-2">
                <input 
                  type="number" 
                  value={bulkCount}
                  onChange={(e) => setBulkCount(e.target.value)}
                  placeholder="최대 번호 (예: 30)"
                  className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button 
                  onClick={generateBulkStudents}
                  className="bg-slate-800 text-white px-4 py-2 rounded-xl hover:bg-slate-900 transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <RefreshCcw className="w-4 h-4" />
                  생성
                </button>
              </div>
            </div>

            <div className="h-px bg-slate-100 my-4" />

            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-600" />
              학생 개별 추가
            </h2>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addStudent()}
                placeholder="이름을 입력하세요"
                className="flex-1 px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
              <button 
                onClick={addStudent}
                className="bg-indigo-600 text-white p-2 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-6">
              <div className="flex justify-between items-end mb-2">
                <span className="text-sm font-medium text-slate-500">
                  학생 명단 ({students.filter(s => !s.isMissing).length} / {students.length}명)
                </span>
              </div>
              <div className="max-h-80 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                {students.map((student) => (
                  <div key={student.id} className={`flex items-center justify-between p-3 rounded-xl group border transition-all ${student.isMissing ? 'bg-slate-100 border-transparent opacity-60' : 'bg-slate-50 border-transparent hover:border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${student.isMissing ? 'line-through text-slate-400' : ''}`}>
                        {student.name}
                      </span>
                      {student.isMissing && (
                        <span className="text-[10px] bg-slate-200 text-slate-500 px-1.5 py-0.5 rounded font-bold uppercase">결번</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => toggleMissingStudent(student.id)}
                        className={`p-1.5 rounded-lg transition-colors ${student.isMissing ? 'text-indigo-600 bg-indigo-50' : 'text-slate-400 hover:bg-white hover:text-indigo-600'}`}
                        title={student.isMissing ? "결번 해제" : "결번 설정"}
                      >
                        {student.isMissing ? <UserCheck className="w-4 h-4" /> : <UserMinus className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => toggleFixStudent(student.id)}
                        disabled={student.isMissing}
                        className={`p-1.5 rounded-lg transition-colors ${student.isFixed ? 'text-amber-600 bg-amber-50' : 'text-slate-400 hover:bg-white hover:text-amber-600'} disabled:opacity-20`}
                        title={student.isFixed ? "자리 고정 해제" : "자리 고정"}
                      >
                        {student.isFixed ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => removeStudent(student.id)}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {students.length === 0 && (
                  <div className="text-center py-8 text-slate-400 italic">
                    등록된 학생이 없습니다.
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* AI Section */}
          <section className="bg-indigo-600 rounded-2xl p-6 shadow-lg text-white">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                AI 자리 조언
              </h2>
              <button 
                onClick={fetchAiAdvice}
                disabled={isAiLoading || students.length === 0}
                className="bg-white/20 hover:bg-white/30 p-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {isAiLoading ? <div className="w-5 h-5 border-2 border-white/50 border-t-white rounded-full animate-spin" /> : <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
            {aiAdvice ? (
              <div className="text-sm bg-white/10 rounded-xl p-4 leading-relaxed">
                {aiAdvice}
              </div>
            ) : (
              <p className="text-sm text-indigo-100">학생들의 성향과 교실 분위기에 맞는 자리를 AI가 추천해드려요.</p>
            )}
          </section>
        </div>

        {/* Right Column: Grid Layout */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 h-full flex flex-col">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
                  <div className="flex items-center gap-2 px-3 py-1">
                    <span className="text-xs font-bold text-slate-400">행</span>
                    <input 
                      type="number" 
                      min="1" max="10" 
                      value={rows} 
                      onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                      className="w-10 bg-transparent text-center font-semibold focus:outline-none"
                    />
                  </div>
                  <div className="w-px h-4 bg-slate-200" />
                  <div className="flex items-center gap-2 px-3 py-1">
                    <span className="text-xs font-bold text-slate-400">열</span>
                    <input 
                      type="number" 
                      min="1" max="10" 
                      value={cols} 
                      onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                      className="w-10 bg-transparent text-center font-semibold focus:outline-none"
                    />
                  </div>
                </div>
                <span className="text-sm text-slate-400">전체 {rows * cols}개 좌석</span>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={shuffleSeats}
                  disabled={students.filter(s => !s.isMissing).length === 0 || isShuffling}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                >
                  <Shuffle className={`w-5 h-5 ${isShuffling ? 'animate-spin' : ''}`} />
                  랜덤 추첨
                </button>
              </div>
            </div>

            {/* Front Label (Teacher Desk) */}
            <div className="w-full text-center py-2 mb-8 bg-slate-100 rounded-lg text-slate-400 font-bold tracking-[0.5em] text-xs uppercase border border-slate-200">
              칠판 / 교탁
            </div>

            {/* Grid Visualization */}
            <div 
              className="grid gap-3 flex-1 items-start" 
              style={{ 
                gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` 
              }}
            >
              {seats.map((seat, index) => {
                const student = students.find(s => s.id === seat.studentId);
                return (
                  <div 
                    key={seat.id}
                    onClick={() => !student && toggleBlockSeat(index)}
                    className={`
                      aspect-[4/3] rounded-xl border-2 flex flex-col items-center justify-center p-2 relative transition-all duration-500
                      ${seat.isBlocked 
                        ? 'bg-slate-50 border-dashed border-slate-200 cursor-pointer hover:bg-slate-100' 
                        : student 
                          ? 'bg-white border-indigo-100 shadow-sm' 
                          : 'bg-white border-slate-100 border-dashed cursor-pointer hover:border-indigo-200'
                      }
                      ${isShuffling ? 'opacity-40 scale-95' : 'opacity-100 scale-100'}
                    `}
                  >
                    {student ? (
                      <>
                        <span className={`text-lg font-bold ${student.isFixed ? 'text-amber-600' : 'text-slate-800'}`}>
                          {student.name}
                        </span>
                        {student.isFixed && (
                          <Lock className="w-3 h-3 text-amber-500 absolute top-2 right-2" />
                        )}
                      </>
                    ) : seat.isBlocked ? (
                      <X className="w-5 h-5 text-slate-300" />
                    ) : (
                      <span className="text-slate-300 text-xs font-medium">{index + 1}</span>
                    )}
                  </div>
                );
              })}
            </div>
            
            <div className="mt-8 flex flex-wrap justify-center gap-6 text-[10px] sm:text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-white border border-slate-200" />
                <span>빈 좌석</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-white border border-amber-500" />
                <span>고정석</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm bg-slate-50 border border-dashed border-slate-200" />
                <span>사용 안 함 (클릭하여 설정)</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Persistent Call-to-Action for Mobile/Quick Access */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white/80 backdrop-blur-lg border border-slate-200 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-4 z-50">
        <button 
          onClick={shuffleSeats}
          disabled={students.filter(s => !s.isMissing).length === 0 || isShuffling}
          className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold hover:bg-indigo-700 transition-all active:scale-95 disabled:opacity-50"
        >
          <Shuffle className={`w-5 h-5 ${isShuffling ? 'animate-spin' : ''}`} />
          다시 뽑기
        </button>
        <div className="w-px h-6 bg-slate-200" />
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <Save className="w-5 h-5" />
        </button>
        <button className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
          <Layout className="w-5 h-5" />
        </button>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
    </div>
  );
};

export default App;
