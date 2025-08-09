import React, { useState, useEffect } from 'react';
import { Facebook, PlusCircle, Trash2, Calculator, GraduationCap, Code2, RefreshCw, X, Sun, Moon, Banknote } from 'lucide-react';
import Confetti from 'react-confetti';

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
  document.documentElement.classList.add('dark');
}

function App() {
  const [completedCredit, setCompletedCredit] = useState();
  const [currentCGPA, setCurrentCGPA] = useState();
  const [courses, setCourses] = useState<any[]>([]);
  const [retakes, setRetakes] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showConfetti, setShowConfetti] = useState(false);
  const [tuitionTotal, setTuitionTotal] = useState<number | undefined>();
  const [activeTab, setActiveTab] = useState<'cgpa' | 'tuition'>('cgpa');
  const [waiverPct, setWaiverPct] = useState<number | undefined>();
  const [scholarshipPct, setScholarshipPct] = useState<number | undefined>();

  // Force dark theme on mount
  useEffect(() => {
    document.documentElement.classList.add('dark');
    localStorage.setItem('theme', 'dark');
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
    document.documentElement.classList.toggle('dark');
    localStorage.setItem('theme', newTheme);
  };

  const closeModal = () => {
    setIsModalClosing(true);
    setTimeout(() => {
      setShowResults(false);
      setIsModalClosing(false);
      setShowConfetti(false);
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
    courses.forEach((course: any) => {
      if (course.credit && course.grade && gradePoints[course.grade] !== undefined) {
        totalPoints += Number(course.credit) * gradePoints[course.grade];
        totalCredits += Number(course.credit);
      }
    });
    retakes.forEach((retake: any) => {
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
    courses.forEach((course: any) => {
      if (course.credit && course.grade && gradePoints[course.grade] !== undefined) {
        adjustedPoints += Number(course.credit) * gradePoints[course.grade];
        totalCredits += Number(course.credit);
      }
    });
    retakes.forEach((retake: any) => {
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
    courses.forEach((course: any) => {
      if (course.credit) totalCredits += Number(course.credit);
    });
    return totalCredits;
  };

  const calculateTotalCredits = () => {
    const defaultCompletedCredit: number = (completedCredit as number) ?? 0;
    return defaultCompletedCredit + courses.reduce((sum: number, course: any) =>
      sum + (course.credit ? Number(course.credit) : 0), 0);
  };

  const handleCalculateClick = () => {
    const newCGPA = calculateCGPA();
    if (currentCGPA !== undefined && newCGPA > (currentCGPA as number)) {
      setShowConfetti(true);
    }
    setShowResults(true);
  };

  // Tuition helpers
  const formatAmount = (n: number) => n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const formatPercent = (p?: number) => (p ? `${p}%` : 'None');

  const discountedTuition = (() => {
    const base = tuitionTotal ?? 0;
    if (base <= 0) return { amount: 0, steps: [] as { after: number; pct: number }[] };
    const selected = [waiverPct, scholarshipPct].filter((v): v is number => typeof v === 'number' && v > 0);
    const sorted = [...selected].sort((a, b) => a - b);
    let amount = base;
    const steps: { after: number; pct: number }[] = [];
    for (const pct of sorted) {
      amount = +(amount * (1 - pct / 100)).toFixed(2);
      steps.push({ after: amount, pct });
    }
    return { amount, steps };
  })();

  const tuitionBreakdown = (() => {
    if (!tuitionTotal || tuitionTotal <= 0) return null;
    const base = discountedTuition.amount || 0;
    const first = +(base * 0.4).toFixed(2);
    const second = +(base * 0.3).toFixed(2);
    const third = +(base - first - second).toFixed(2);
    return { first, second, third, total: +base.toFixed(2) };
  })();

  // Installment due dates (static display)
  const installmentDates = {
    first: 'Aug 13, 2025',
    second: 'Sep 14, 2025',
    third: 'Oct 12, 2025',
  } as const;

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-black text-gray-900 dark:text-white p-3 sm:p-6 transition-colors duration-300">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-end mb-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 transition-colors duration-300"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="text-yellow-500" size={24} /> : <Moon className="text-blue-500" size={24} />}
          </button>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-center mb-2">
          <span className="text-orange-500">UIU</span> CGPA CALCULATOR
        </h1>
        <p className="text-center mb-1 text-sm sm:text-base flex items-center justify-center gap-2">
          <Code2 size={20} className="text-orange-500" />
          Developed by <span className="text-orange-500 font-semibold hover:text-orange-400 transition-colors cursor-default">Ishmam</span>
        </p>
        <div className="flex items-center justify-center gap-2 mb-6 sm:mb-8">
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

        {/* Tabs */}
        <div className="mb-4 sm:mb-6 flex gap-2">
          <button
            onClick={() => setActiveTab('cgpa')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'cgpa'
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            CGPA Calculator
          </button>
          <button
            onClick={() => setActiveTab('tuition')}
            className={`px-4 py-2 rounded-lg font-semibold transition-all ${
              activeTab === 'tuition'
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-gray-200 dark:bg-gray-800 hover:bg-gray-300 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
            }`}
          >
            Tuition Fee
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
                  value={completedCredit || ''}
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
                  value={currentCGPA || ''}
                  onChange={(e) => setCurrentCGPA(e.target.value ? Number(e.target.value) : undefined)}
                  placeholder="Enter current CGPA"
                  className="w-full bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white p-2 rounded border border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500 text-sm sm:text-base transition-colors duration-300"
                />
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-3 sm:p-6 rounded-lg mb-4 sm:mb-6 shadow-md transition-colors duration-300">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold">Current Trimester Courses</h2>
                <div className="flex gap-2 w-full sm:w-auto">
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

            <button
              onClick={handleCalculateClick}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 font-bold text-base sm:text-lg flex items-center justify-center gap-2"
            >
              <Calculator size={24} />
              Calculate
            </button>
          </>
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
                    <div>Gross Total: <span className="font-semibold">{formatAmount(tuitionTotal)}</span></div>
                    {(waiverPct || scholarshipPct) ? (
                      <>
                        {discountedTuition.steps.map((s, idx) => (
                          <div key={idx}>After {s.pct}%: <span className="font-semibold">{formatAmount(s.after)}</span></div>
                        ))}
                        <div>Final Payable: <span className="font-semibold text-green-600">{formatAmount(discountedTuition.amount)}</span></div>
                        <div>You save: <span className="font-semibold text-orange-500">{formatAmount(+((tuitionTotal - discountedTuition.amount).toFixed(2)))}</span></div>
                      </>
                    ) : (
                      <div>Final Payable: <span className="font-semibold">{formatAmount(tuitionTotal)}</span></div>
                    )}
                  </div>
                </div>
              )}

              {tuitionBreakdown && (
                <>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">First Payment (40%)</p>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(tuitionBreakdown.first)}</p>
                    <p className="text-xs text-gray-500 mt-1">Due: {installmentDates.first}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Second Payment (30%)</p>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(tuitionBreakdown.second)}</p>
                    <p className="text-xs text-gray-500 mt-1">Due: {installmentDates.second}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Third Payment (30%)</p>
                    <p className="text-2xl font-bold text-green-600">{formatAmount(tuitionBreakdown.third)}</p>
                    <p className="text-xs text-gray-500 mt-1">Due: {installmentDates.third}</p>
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
            {showConfetti && <Confetti 
              width={window.innerWidth}
              height={window.innerHeight}
              recycle={false}
              numberOfPieces={200}
              gravity={0.3}
            />}
            <div 
              className={`absolute inset-0 backdrop-blur-sm bg-black/70 transition-all duration-300 ${
                isModalClosing ? 'opacity-0' : 'opacity-100'
              }`}
              onClick={closeModal}
            />
            
            <div 
              className={`relative bg-white dark:bg-gray-900 p-6 rounded-lg w-full max-w-2xl transform transition-all duration-300 ${
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