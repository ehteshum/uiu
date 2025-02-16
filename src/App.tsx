import React, { useState, useEffect } from 'react';
import { Facebook, PlusCircle, Trash2, Calculator, GraduationCap, Code2, RefreshCw, X, Sun, Moon } from 'lucide-react';

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
  const [courses, setCourses] = useState([]);
  const [retakes, setRetakes] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [isModalClosing, setIsModalClosing] = useState(false);
  const [theme, setTheme] = useState('dark');

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
    // Check for saved theme preference or use dark theme by default
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      // Set dark theme as default
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
    
    courses.forEach(course => {
      if (course.credit && course.grade && gradePoints[course.grade] !== undefined) {
        totalPoints += Number(course.credit) * gradePoints[course.grade];
        totalCredits += Number(course.credit);
      }
    });

    retakes.forEach(retake => {
      if (retake.credit && retake.newGrade && gradePoints[retake.newGrade] !== undefined) {
        totalPoints += Number(retake.credit) * gradePoints[retake.newGrade];
        totalCredits += Number(retake.credit);
      }
    });
    
    const gpa = totalCredits > 0 ? totalPoints / totalCredits : 0;
    return Math.min(4.0, gpa);
  };

  const calculateCGPA = () => {
    if (completedCredit === undefined || currentCGPA === undefined) return 0;
    
    let adjustedPoints = currentCGPA * completedCredit;
    let totalCredits = completedCredit;
    
    courses.forEach(course => {
      if (course.credit && course.grade && gradePoints[course.grade] !== undefined) {
        adjustedPoints += Number(course.credit) * gradePoints[course.grade];
        totalCredits += Number(course.credit);
      }
    });
    
    retakes.forEach(retake => {
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

  const calculateCurrentSemesterCredits = () => {
    let totalCredits = 0;
    
    courses.forEach(course => {
      if (course.credit) {
        totalCredits += Number(course.credit);
      }
    });
    
    return totalCredits;
  };

  const calculateTotalCredits = () => {
    return (completedCredit || 0) + courses.reduce((sum, course) => 
      sum + (course.credit ? Number(course.credit) : 0), 0);
  };

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
          Made by <span className="text-orange-500 font-semibold hover:text-orange-400 transition-colors cursor-default">Ishmam</span>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white dark:bg-gray-900 p-3 sm:p-4 rounded-lg shadow-md transition-colors duration-300">
            <label className="block mb-2 text-sm sm:text-base">Completed Credits</label>
            <input
              type="number"
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
            <h2 className="text-lg sm:text-xl font-semibold">Current Semester Courses</h2>
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
                className="self-end bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-300 transform hover:scale-110 hover:shadow-lg active:scale-95 flex items-center justify-center"
                aria-label="Remove course"
              >
                <Trash2 size={20} />
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
                className="self-end bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-all duration-300 transform hover:scale-110 hover:shadow-lg active:scale-95 flex items-center justify-center"
                aria-label="Remove retake"
              >
                <Trash2 size={20} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShowResults(true)}
          className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 font-bold text-base sm:text-lg flex items-center justify-center gap-2"
        >
          <Calculator size={24} />
          Calculate
        </button>

        {showResults && (
          <div 
            className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
              isModalClosing ? 'opacity-0' : 'opacity-100'
            }`}
          >
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
                  <p className="text-sm mb-1">Current Semester GPA</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-500">{calculateGPA().toFixed(2)}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
                  <p className="text-sm mb-1">Overall CGPA</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-500">{calculateCGPA().toFixed(2)}</p>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800/80 backdrop-blur-sm p-4 rounded-lg transform hover:scale-105 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/20">
                  <p className="text-sm mb-1">Current Semester Credits</p>
                  <p className="text-2xl sm:text-3xl font-bold text-orange-500">{calculateCurrentSemesterCredits()}</p>
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