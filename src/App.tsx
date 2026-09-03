import React, { useState, useEffect } from 'react';
import { Facebook, PlusCircle, Trash2, Calculator, GraduationCap, Code2, RefreshCw, X, Sun, Moon, Banknote, Target, RotateCcw } from 'lucide-react';
import AdminInstallments from './components/AdminInstallments'
import supabase from './lib/supabase'
// Confetti removed to improve performance

interface Course {
  credit: string;
  grade: string;
}

interface Retake {
  credit: string;
  newGrade: string;
  oldGrade: string;
}

const gradePoints: { [key: string]: number } = {
  'A': 4.00,
  'A-': 3.67,
  'B+': 3.33,
  'B': 3.00,
  'B-': 2.67,
  'C+': 2.33,
  'C': 2.00,
  'C-': 1.67,
  'D+': 1.33,
  'D': 1.00,
  'F': 0.00
};

const creditOptions = [1, 2, 3, 4, 5, 6];

// Initialize dark theme immediately
if (typeof document !== 'undefined') {
  const savedTheme = localStorage.getItem('theme');
  document.documentElement.classList.toggle('dark', savedTheme !== 'light');
}

const parseStoredArray = <T,>(key: string): T[] => {
  const saved = localStorage.getItem(key);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    localStorage.removeItem(key);
    return [];
  }
};

function App() {
  const [completedCredit, setCompletedCredit] = useState<number | undefined>(() => {
    const saved = localStorage.getItem('completedCredit');
    return saved ? Number(saved) : undefined;
  });
  const [currentCGPA, setCurrentCGPA] = useState<number | undefined>(() => {
    const saved = localStorage.getItem('currentCGPA');
    return saved ? Number(saved) : undefined;
  });
  const [courses, setCourses] = useState<Course[]>(() => parseStoredArray<Course>('courses'));
  const [retakes, setRetakes] = useState<Retake[]>(() => parseStoredArray<Retake>('retakes'));
  const [showResults, setShowResults] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => (
    localStorage.getItem('theme') === 'light' ? 'light' : 'dark'
  ));
  // Confetti state removed
  const [tuitionTotal, setTuitionTotal] = useState<number | undefined>(() => {
    const saved = localStorage.getItem('tuitionTotal');
    return saved ? Number(saved) : undefined;
  });
  const [activeTab, setActiveTab] = useState<'cgpa' | 'tuition' | 'target'>('cgpa');
  const [waiverPct, setWaiverPct] = useState<number | undefined>(() => {
    const saved = localStorage.getItem('waiverPct');
    return saved ? Number(saved) : undefined;
  });
  const [scholarshipPct, setScholarshipPct] = useState<number | undefined>(() => {
    const saved = localStorage.getItem('scholarshipPct');
    return saved ? Number(saved) : undefined;
  });
  const [trimesterFee, setTrimesterFee] = useState<number>(() => {
    const saved = localStorage.getItem('trimesterFee');
    return saved ? Number(saved) : 6500;
  });

  // Target CGPA states
  const [targetCGPA, setTargetCGPA] = useState<number | undefined>(() => {
    const saved = localStorage.getItem('targetCGPA');
    return saved ? Number(saved) : undefined;
  });
  const [targetCredits, setTargetCredits] = useState<number | undefined>(() => {
    const saved = localStorage.getItem('targetCredits');
    return saved ? Number(saved) : undefined;
  });
  const [installmentDates, setInstallmentDates] = useState({ first: '', second: '', third: '' });
  const [countdown, setCountdown] = useState<{ days: number; label: string; date: string } | null>(null);

  // Persist state changes
  useEffect(() => {
    if (completedCredit !== undefined) localStorage.setItem('completedCredit', String(completedCredit));
    else localStorage.removeItem('completedCredit');
  }, [completedCredit]);

  // Countdown calculation - runs every minute and on date changes
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const dates = [
        { label: '1st Installment', date: installmentDates.first },
        { label: '2nd Installment', date: installmentDates.second },
        { label: '3rd Installment', date: installmentDates.third },
      ];

      let next: { days: number; label: string; date: string } | null = null;

      for (const d of dates) {
        if (!d.date) continue;
        const deadline = new Date(d.date);
        if (isNaN(deadline.getTime())) continue;
        
        // Set to end of day for deadline
        deadline.setHours(23, 59, 59, 999);
        
        const diffMs = deadline.getTime() - now.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffDays >= 0) {
          // This deadline hasn't passed yet
          if (!next || diffDays < next.days) {
            next = { days: diffDays, label: d.label, date: d.date };
          }
        }
      }

      setCountdown(next);
    };

    calculateCountdown();
    const interval = setInterval(calculateCountdown, 60_000); // Update every minute
    return () => clearInterval(interval);
  }, [installmentDates]);

  useEffect(() => {
    if (currentCGPA !== undefined) localStorage.setItem('currentCGPA', String(currentCGPA));
    else localStorage.removeItem('currentCGPA');
  }, [currentCGPA]);

  useEffect(() => {
    localStorage.setItem('courses', JSON.stringify(courses));
  }, [courses]);

  useEffect(() => {
    localStorage.setItem('retakes', JSON.stringify(retakes));
  }, [retakes]);

  useEffect(() => {
    if (tuitionTotal !== undefined) localStorage.setItem('tuitionTotal', String(tuitionTotal));
    else localStorage.removeItem('tuitionTotal');
  }, [tuitionTotal]);

  useEffect(() => {
    if (waiverPct !== undefined) localStorage.setItem('waiverPct', String(waiverPct));
    else localStorage.removeItem('waiverPct');
  }, [waiverPct]);

  useEffect(() => {
    if (scholarshipPct !== undefined) localStorage.setItem('scholarshipPct', String(scholarshipPct));
    else localStorage.removeItem('scholarshipPct');
  }, [scholarshipPct]);

  useEffect(() => {
    localStorage.setItem('trimesterFee', String(trimesterFee));
  }, [trimesterFee]);

  useEffect(() => {
    if (targetCGPA !== undefined) localStorage.setItem('targetCGPA', String(targetCGPA));
    else localStorage.removeItem('targetCGPA');
  }, [targetCGPA]);

  useEffect(() => {
    if (targetCredits !== undefined) localStorage.setItem('targetCredits', String(targetCredits));
    else localStorage.removeItem('targetCredits');
  }, [targetCredits]);

  useEffect(() => {
    let mounted = true;

    const loadInstallmentDates = async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'installment_dates')
        .single();

      if (!mounted) return;

      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          setInstallmentDates({
            first: typeof parsed.first === 'string' ? parsed.first : '',
            second: typeof parsed.second === 'string' ? parsed.second : '',
            third: typeof parsed.third === 'string' ? parsed.third : '',
          });
        } catch {
          setInstallmentDates({ first: '', second: '', third: '' });
        }
      }
    };

    loadInstallmentDates();
    const refreshId = setInterval(loadInstallmentDates, 60_000);

    return () => {
      mounted = false;
      clearInterval(refreshId);
    };
  }, []);

  useEffect(() => {
    if (showResults) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [showResults]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      setTheme('dark');
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
    localStorage.setItem('theme', newTheme);
  };

  const closeModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setShowResults(false);
      setIsModalClosing(false);
    }, 300);
  };

  const addCourse = () => {
    setCourses([{ credit: '', grade: '' }, ...courses]);
    setShowResults(false);
  };

  const addRetake = () => {
    setRetakes([{ credit: '', newGrade: '', oldGrade: '' }, ...retakes]);
    setShowResults(false);
  };

  const updateCourse = (index: number, field: keyof Course, value: string) => {
    const newCourses = [...courses];
    newCourses[index][field] = value;
    setCourses(newCourses);
    setShowResults(false);
  };

  const updateRetake = (index: number, field: keyof Retake, value: string) => {
    const newRetakes = [...retakes];
    newRetakes[index][field] = value;
    setRetakes(newRetakes);
    setShowResults(false);
  };

  const removeCourse = (index: number) => {
    setCourses(courses.filter((_, i) => i !== index));
    setShowResults(false);
  };

  const removeRetake = (index: number) => {
    setRetakes(retakes.filter((_, i) => i !== index));
    setShowResults(false);
  };

  const calculateGPA = () => {
    if (courses.length === 0 && retakes.length === 0) return 0;
    let totalPoints = 0;
    let totalCredits = 0;
    courses.forEach((course) => {
      if (course.credit && course.grade && gradePoints[course.grade] !== undefined) {
        totalPoints += Number(course.credit) * gradePoints[course.grade];
        totalCredits += Number(course.credit);
      }
    });
    retakes.forEach((retake) => {
      if (retake.credit && retake.newGrade && gradePoints[retake.newGrade] !== undefined) {
        totalPoints += Number(retake.credit) * gradePoints[retake.newGrade];
        totalCredits += Number(retake.credit);
      }
    });
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    return Math.min(4.0, gpa);
  };

  const calculateCGPA = () => {
    const defaultCompletedCredit: number = (completedCredit as number) ?? 0;
    const defaultCurrentCGPA: number = (currentCGPA as number) ?? 0;
    let adjustedPoints = defaultCurrentCGPA * defaultCompletedCredit;
    let totalCredits = defaultCompletedCredit;
    courses.forEach((course) => {
      if (course.credit && course.grade && gradePoints[course.grade] !== undefined) {
        adjustedPoints += Number(course.credit) * gradePoints[course.grade];
        totalCredits += Number(course.credit);
      }
    });
    retakes.forEach((retake) => {
      if (retake.credit && retake.newGrade && retake.oldGrade &&
          gradePoints[retake.newGrade] !== undefined &&
          gradePoints[retake.oldGrade] !== undefined) {
        adjustedPoints = adjustedPoints - (Number(retake.credit) * gradePoints[retake.oldGrade])
                                     + (Number(retake.credit) * gradePoints[retake.newGrade]);
      }
    });
    const cgpa = totalCredits > 0 ? adjustedPoints / totalCredits : 0;
    return Math.min(4.0, cgpa);
  };

  const calculateCurrentTrimesterCredits = () => {
    let totalCredits = 0;
    courses.forEach((course) => {
      if (course.credit) totalCredits += Number(course.credit);
    });
    return totalCredits;
  };

  const calculateTotalCredits = () => {
    const defaultCompletedCredit: number = (completedCredit as number) ?? 0;
    return defaultCompletedCredit + courses.reduce((sum, course) =>
      sum + (course.credit ? Number(course.credit) : 0), 0);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to clear all data?')) {
      setCompletedCredit(undefined);
      setCurrentCGPA(undefined);
      setCourses([]);
      setRetakes([]);
      setTuitionTotal(undefined);
      setWaiverPct(undefined);
      setScholarshipPct(undefined);
      setTrimesterFee(6500);
      setTargetCGPA(undefined);
      setTargetCredits(undefined);
      setInstallmentDates({ first: '', second: '', third: '' });
      localStorage.clear();
      // Restore theme preference
      localStorage.setItem('theme', theme);
    }
  };

  const handleCalculateClick = () => {
    setShowResults(true);
  };

  const calculateTargetGPA = () => {
    if (
      currentCGPA === undefined ||
      completedCredit === undefined ||
      targetCGPA === undefined ||
      targetCredits === undefined ||
      targetCredits <= 0
    ) return null;
    
    const currentPoints = currentCGPA * completedCredit;
    const totalCredits = completedCredit + targetCredits;
    const targetPoints = targetCGPA * totalCredits;
    const requiredPoints = targetPoints - currentPoints;
    const requiredGPA = requiredPoints / targetCredits;
    
    return requiredGPA;
  };

  // Tuition helpers
  const formatAmount = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const weekdayOf = (dateText: string) => {
    const d = new Date(dateText);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString(undefined, { weekday: 'long' });
  };
  const formatDate = (dateText: string) => {
    const d = new Date(dateText);
    if (isNaN(d.getTime())) return '';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const discountedTuition = (() => {
    const main = tuitionTotal ?? 0;
    const term = trimesterFee ?? 0;
    if (main <= 0) return { amount: 0, steps: [] as { after: number; pct: number }[], baseNet: 0, amountNet: 0, main, term };
    const baseNet = +(Math.max(0, main - term)).toFixed(2);
    const selected = [waiverPct, scholarshipPct].filter((v): v is number => typeof v === 'number' && v > 0);
    const sorted = [...selected].sort((a, b) => a - b);
    let amountNet = baseNet;
    const steps: { after: number; pct: number }[] = [];
    for (const pct of sorted) {
      amountNet = +(amountNet * (1 - pct / 100)).toFixed(2);
      steps.push({ after: amountNet, pct });
    }
    const finalTotal = +(amountNet + term).toFixed(2);
    return { amount: finalTotal, steps, baseNet, amountNet, main, term };
  })();

  const tuitionBreakdown = (() => {
    if (!tuitionTotal || tuitionTotal <= 0) return null;
    const total = discountedTuition.amount || 0; // final payable after discounts + trimester fee added back
    const first = +(total * 0.4).toFixed(2);
    const second = +(total * 0.3).toFixed(2);
    const third = +(total - first - second).toFixed(2);
    return { first, second, third, total: +total.toFixed(2) };
  })();

  const isAdminRoute = typeof window !== 'undefined' && window.location.pathname === '/admin';

  if (isAdminRoute) {
    return <AdminInstallments />;
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white p-3 sm:p-6 transition-colors duration-300 safe-px safe-pt safe-pb">
      <div className="w-full max-w-3xl mx-auto">
        <div className="flex justify-end mb-4 gap-2">
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 transition-colors duration-300"
            aria-label="Reset all data"
            title="Reset all data"
          >
            <RotateCcw size={24} />
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="text-yellow-500" size={24} /> : <Moon className="text-blue-500" size={24} />}
          </button>
        </div>
  <h1 className="text-2xl sm:text-4xl font-bold text-center mb-2 leading-tight">
          <span className="text-orange-500">UIU</span> CGPA CALCULATOR
        </h1>
        <p className="text-center mb-1 text-sm sm:text-base flex items-center justify-center gap-2">
          <Code2 size={20} className="text-orange-500" />
          Developed by <span className="text-orange-500 font-semibold hover:text-orange-400 transition-colors cursor-default">Ishmam</span>
        </p>
  <div className="flex flex-wrap items-center justify-center gap-2 mb-6 sm:mb-8">
          <span className="text-sm sm:text-base">Contact:</span>
          <a 
            href="https://www.facebook.com/ishmamr.1" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 transition-colors transform hover:scale-110"
          >
            <Facebook size={24} />
          </a>
        </div>

        {/* Deadline Countdown Banner */}
        {countdown && (
          <div className={`mb-4 sm:mb-6 p-3 sm:p-4 rounded-lg border-l-4 transition-all duration-300 animate-pulse-subtle
            ${countdown.days <= 2 
              ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-300' 
              : countdown.days <= 7 
                ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-500 text-orange-700 dark:text-orange-300' 
                : 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-300'
            }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-semibold text-sm sm:text-base">
                {countdown.label} Due: {countdown.days === 0 ? 'Today' : countdown.days === 1 ? 'Tomorrow' : `in ${countdown.days} days`}
              </span>
            </div>
            <div className="text-xs sm:text-sm opacity-80">
              {new Date(countdown.date).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </div>
          </div>
        </div>)}

        {/* Tabs */}
        <div className="mb-4 sm:mb-6 grid grid-cols-3 gap-2">
          <button
            onClick={() => setActiveTab('cgpa')}
            className={`px-2 sm:px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base ${
              activeTab === 'cgpa'
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            <GraduationCap size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">CGPA Calculator</span>
            <span className="sm:hidden">CGPA</span>
          </button>
          <button
            onClick={() => setActiveTab('tuition')}
            className={`px-2 sm:px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base ${
              activeTab === 'tuition'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            <Banknote size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Tuition Fee</span>
            <span className="sm:hidden">Tuition</span>
          </button>
          <button
            onClick={() => setActiveTab('target')}
            className={`px-2 sm:px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-base ${
              activeTab === 'target'
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            <Target size={16} className="sm:w-[18px] sm:h-[18px]" />
            <span className="hidden sm:inline">Target CGPA</span>
            <span className="sm:hidden">Target</span>
          </button>
        </div>

        {activeTab === 'cgpa' && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
              <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-lg shadow-md transition-colors duration-300">
                <label className="block mb-2 text-sm sm:text-base">Completed Credits</label>
                <input
                  type="number"
                  min="0"
                  value={completedCredit ?? ''}
                  onChange={(e) => setCompletedCredit(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Enter completed credits"
                  className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded border border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500 text-sm sm:text-base transition-colors duration-300"
                />
              </div>
              <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-lg shadow-md transition-colors duration-300">
                <label className="block mb-2 text-sm sm:text-base">Current CGPA</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max="4.00"
                  value={currentCGPA ?? ''}
                  onChange={(e) => setCurrentCGPA(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Enter current CGPA"
                  className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded border border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500 text-sm sm:text-base transition-colors duration-300"
                />
              </div>
            </div>

            <button
              onClick={handleCalculateClick}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 font-bold text-base sm:text-lg flex items-center justify-center gap-2 mb-4 sm:mb-6"
            >
              <Calculator size={24} />
              Calculate
            </button>

            <div className="bg-white dark:bg-gray-900 p-3 sm:p-6 rounded-lg mb-4 sm:mb-6 shadow-md transition-colors duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Current Trimester Courses</h2>
                <div className="flex gap-2 w-full sm:w-auto flex-wrap">
                  <button
                    onClick={addCourse}
                    className="flex-1 sm:flex-none bg-orange-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 font-semibold flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base"
                  >
                    <PlusCircle size={20} />
                    Add Course
                  </button>
                  <button
                    onClick={addRetake}
                    className="flex-1 sm:flex-none bg-blue-500 text-white px-4 sm:px-6 py-2 rounded-lg hover:bg-blue-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 font-semibold flex items-center justify-center sm:justify-start gap-2 text-sm sm:text-base"
                  >
                    <RefreshCw size={20} />
                    Add Retake
                  </button>
                </div>
              </div>

              {courses.map((course, index) => (
                <div key={index} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg transition-colors duration-300">
                  <div className="flex-1">
                    <label className="block mb-1 text-sm sm:text-base">Credits</label>
                    <select
                      value={course.credit}
                      onChange={(e) => updateCourse(index, 'credit', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base transition-colors duration-300"
                    >
                      <option value="">Select credits</option>
                      {creditOptions.map((credit) => (
                        <option key={credit} value={credit}>
                          {credit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-sm sm:text-base">Grade</label>
                    <select
                      value={course.grade}
                      onChange={(e) => updateCourse(index, 'grade', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base transition-colors duration-300"
                    >
                      <option value="">Select grade</option>
                      {Object.keys(gradePoints).map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removeCourse(index)}
                    className="self-end bg-red-500 text-white p-2.5 rounded-md hover:bg-red-600 transition-all duration-300 transform hover:scale-110 hover:shadow-lg active:scale-95 flex items-center justify-center"
                    aria-label="Remove course"
                  >
                    <Trash2 size={19} />
                  </button>
                </div>
              ))}

              {retakes.map((retake, index) => (
                <div key={`retake-${index}`} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg transition-colors duration-300">
                  <div className="flex-1">
                    <label className="block mb-1 text-sm sm:text-base">Credits</label>
                    <select
                      value={retake.credit}
                      onChange={(e) => updateRetake(index, 'credit', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base transition-colors duration-300"
                    >
                      <option value="">Select credits</option>
                      {creditOptions.map((credit) => (
                        <option key={credit} value={credit}>
                          {credit}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-sm sm:text-base">New Grade</label>
                    <select
                      value={retake.newGrade}
                      onChange={(e) => updateRetake(index, 'newGrade', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base transition-colors duration-300"
                    >
                      <option value="">Select grade</option>
                      {Object.keys(gradePoints).map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block mb-1 text-sm sm:text-base">Old Grade</label>
                    <select
                      value={retake.oldGrade}
                      onChange={(e) => updateRetake(index, 'oldGrade', e.target.value)}
                      className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base transition-colors duration-300"
                    >
                      <option value="">Select grade</option>
                      {Object.keys(gradePoints).map((grade) => (
                        <option key={grade} value={grade}>
                          {grade}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => removeRetake(index)}
                    className="self-end bg-red-500 text-white p-2.5 rounded-md hover:bg-red-600 transition-all duration-300 transform hover:scale-110 hover:shadow-lg active:scale-95 flex items-center justify-center"
                    aria-label="Remove retake"
                  >
                    <Trash2 size={19} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'target' && (
          <div className="bg-white dark:bg-gray-900 p-3 sm:p-6 rounded-lg mb-4 sm:mb-6 shadow-md transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <Target size={22} className="text-purple-500" />
                Target CGPA Calculator
              </h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg">
                <label className="block mb-2 text-sm sm:text-base">Current CGPA</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max="4.00"
                  value={currentCGPA ?? ''}
                  onChange={(e) => setCurrentCGPA(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 3.50"
                  className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 text-sm sm:text-base transition-colors duration-300"
                />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg">
                <label className="block mb-2 text-sm sm:text-base">Completed Credits</label>
                <input
                  type="number"
                  min="0"
                  value={completedCredit ?? ''}
                  onChange={(e) => setCompletedCredit(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 60"
                  className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 text-sm sm:text-base transition-colors duration-300"
                />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg">
                <label className="block mb-2 text-sm sm:text-base">Target CGPA</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  max="4.00"
                  value={targetCGPA ?? ''}
                  onChange={(e) => setTargetCGPA(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 3.60"
                  className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 text-sm sm:text-base transition-colors duration-300"
                />
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 p-3 sm:p-4 rounded-lg">
                <label className="block mb-2 text-sm sm:text-base">Credits This Trimester</label>
                <input
                  type="number"
                  min="0"
                  value={targetCredits ?? ''}
                  onChange={(e) => setTargetCredits(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="e.g., 12"
                  className="w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-white p-2 rounded border border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500 placeholder-gray-500 text-sm sm:text-base transition-colors duration-300"
                />
              </div>
            </div>

            {calculateTargetGPA() !== null && (
              <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-200 dark:border-purple-800">
                <p className="text-center text-sm text-gray-600 dark:text-gray-300 mb-2">
                  To reach a CGPA of <span className="font-bold text-purple-600 dark:text-purple-400">{targetCGPA?.toFixed(2)}</span>, you need a GPA of:
                </p>
                <p className={`text-3xl sm:text-4xl font-bold text-center ${
                  (calculateTargetGPA() || 0) > 4.0 
                    ? 'text-red-500' 
                    : (calculateTargetGPA() || 0) < 0 
                      ? 'text-green-500' 
                      : 'text-purple-600 dark:text-purple-400'
                }`}>
                  {(calculateTargetGPA() || 0).toFixed(2)}
                </p>
                {(calculateTargetGPA() || 0) > 4.0 && (
                  <p className="text-center text-red-500 text-sm mt-2 font-medium">
                    Impossible! Even with a 4.00, you cannot reach this CGPA this trimester.
                  </p>
                )}
                {(calculateTargetGPA() || 0) <= 0 && (
                  <p className="text-center text-green-500 text-sm mt-2 font-medium">
                    You already have this CGPA or higher!
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'tuition' && (
          <div className="bg-white dark:bg-gray-900 p-3 sm:p-6 rounded-lg mb-4 sm:mb-6 shadow-md transition-colors duration-300">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <Banknote size={22} className="text-green-500" />
                Tuition Fee Breakdown
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="col-span-1 sm:col-span-2">
                <label className="block mb-2 text-sm sm:text-base">Total Fee for this Trimester</label>
                <p className="-mt-1 mb-2 text-xs text-gray-500">(Showing on UCAM)</p>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={tuitionTotal ?? ''}
                  onChange={(e) => setTuitionTotal(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Enter total amount (e.g., 75000)"
                  className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded border border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500 text-sm sm:text-base transition-colors duration-300"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block mb-2 text-sm sm:text-base">Trimester Fee</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={trimesterFee}
                  onChange={(e) => setTrimesterFee(e.target.value ? Number(e.target.value) : 0)}
                  placeholder="Default 6500"
                  className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded border border-green-500 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-500 text-sm sm:text-base transition-colors duration-300"
                />
                <p className="text-xs text-gray-500 mt-1">Default is 6500. Change it if needed.</p>
              </div>

              {/* Waiver selection */}
              <div className="col-span-1">
                <label className="block mb-2 text-sm sm:text-base">Waiver</label>
                <div className="flex flex-wrap gap-2">
                  {[undefined, 20, 25, 50].map((p, i) => (
                    <button
                      key={`waiver-${p ?? 'none'}`}
                      type="button"
                      onClick={() => setWaiverPct(p as number | undefined)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        waiverPct === p
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {p ? `${p}%` : 'None'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scholarship selection */}
              <div className="col-span-1">
                <label className="block mb-2 text-sm sm:text-base">Scholarship</label>
                <div className="flex flex-wrap gap-2">
                  {[undefined, 25, 50, 100].map((p) => (
                    <button
                      key={`scholar-${p ?? 'none'}`}
                      type="button"
                      onClick={() => setScholarshipPct(p as number | undefined)}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                        scholarshipPct === p
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-700'
                      }`}
                    >
                      {p ? `${p}%` : 'None'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Discount summary */}
              {tuitionTotal && tuitionTotal > 0 && (
                <div className="col-span-1 sm:col-span-2 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                  <div className="text-sm text-gray-700 dark:text-gray-300 flex flex-col gap-1">
                    <div>Entered Total: <span className="font-semibold">{formatAmount(tuitionTotal)}</span></div>
                    {(waiverPct || scholarshipPct) && discountedTuition.steps.length > 0 ? (
                      <>
                        {discountedTuition.steps.map((s, idx) => (
                          <div key={idx}>After {s.pct}%: <span className="font-semibold">{formatAmount(s.after)}</span></div>
                        ))}
                        <div>Final Payable: <span className="font-semibold text-green-600">{formatAmount(discountedTuition.amount)}</span></div>
                        <div>You save: <span className="font-semibold text-orange-500">{formatAmount(+((discountedTuition.main - discountedTuition.amount).toFixed(2)))}</span></div>
                      </>
                    ) : (
                      <div>Final Payable: <span className="font-semibold">{formatAmount(discountedTuition.amount)}</span></div>
                    )}
                  </div>
                </div>
              )}

              {tuitionBreakdown && (
                <>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">First Payment (40%)</p>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(tuitionBreakdown.first)}</p>
                    {installmentDates.first && (
                    <p className="mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 border border-yellow-200/80 dark:border-yellow-700/50 text-xs">
                        <span className="opacity-80">Last Date:</span>
                        <span className="font-semibold">
                          {formatDate(installmentDates.first)}
                          {weekdayOf(installmentDates.first) ? ` (${weekdayOf(installmentDates.first)})` : ''}
                        </span>
                      </span>
                    </p>
                    )}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Second Payment (30%)</p>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(tuitionBreakdown.second)}</p>
                    {installmentDates.second && (
                    <p className="mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 border border-yellow-200/80 dark:border-yellow-700/50 text-xs">
                        <span className="opacity-80">Last Date:</span>
                        <span className="font-semibold">
                          {formatDate(installmentDates.second)}
                          {weekdayOf(installmentDates.second) ? ` (${weekdayOf(installmentDates.second)})` : ''}
                        </span>
                      </span>
                    </p>
                    )}
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Third Payment (30%)</p>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(tuitionBreakdown.third)}</p>
                    {installmentDates.third && (
                    <p className="mt-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200 border border-yellow-200/80 dark:border-yellow-700/50 text-xs">
                        <span className="opacity-80">Last Date:</span>
                        <span className="font-semibold">
                          {formatDate(installmentDates.third)}
                          {weekdayOf(installmentDates.third) ? ` (${weekdayOf(installmentDates.third)})` : ''}
                        </span>
                      </span>
                    </p>
                    )}
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-800/80 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Total</p>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(tuitionBreakdown.total)}</p>
                  </div>
                </>
              )}
            </div>
            <p className="mt-3 text-xs text-gray-500">Note: Values are auto-calculated; the third payment adjusts slightly for rounding so the sum equals the total.</p>
          </div>
        )}

        {showResults && (
          <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
              isModalClosing ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {/* Confetti removed */}
            <div 
              className={`absolute inset-0 backdrop-blur-sm bg-black/70 transition-all duration-300 ${
                isModalClosing ? 'opacity-0' : 'opacity-100'
              }`}
              onClick={closeModal}
            />
            
            <div 
              className={`relative bg-white dark:bg-gray-900 p-4 sm:p-6 rounded-lg w-full max-w-2xl mx-3 sm:mx-0 max-h-[85vh] overflow-y-auto overscroll-contain transform transition-all duration-300 ${
                isModalClosing 
                  ? 'opacity-0 scale-95 translate-y-4' 
                  : 'opacity-100 scale-100 translate-y-0'
              }`}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                  <GraduationCap size={28} className="text-orange-500" />
                  Results
                </h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors hover:rotate-90 transform duration-300"
                >
                  <X size={24} />
                </button>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
                  <p className="text-sm mb-1">Current Trimester GPA</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-500">{calculateGPA().toFixed(2)}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
                  <p className="text-sm mb-1">Overall CGPA</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-500">{calculateCGPA().toFixed(2)}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
                  <p className="text-sm mb-1">Current Trimester Credits</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-500">{calculateCurrentTrimesterCredits()}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
                  <p className="text-sm mb-1">Total Credits Completed</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-500">{calculateTotalCredits()}</p>
                </div>
              </div>

              <button
                onClick={closeModal}
                className="w-full mt-6 bg-gray-700/80 backdrop-blur-sm text-white py-3 rounded-lg hover:bg-gray-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-orange-500/20 active:scale-95 font-bold text-base sm:text-lg"
              >
                Back to Calculator
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
