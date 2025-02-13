import React, { useState } from 'react';
import { Facebook, PlusCircle, Trash2, Calculator, GraduationCap, Code2, RefreshCw } from 'lucide-react';

const gradePoints = {
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

function App() {
  const [completedCredit, setCompletedCredit] = useState();
  const [currentCGPA, setCurrentCGPA] = useState();
  const [courses, setCourses] = useState([]);
  const [retakes, setRetakes] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const addCourse = () => {
    setCourses([...courses, { credit: '', grade: '' }]);
    setShowResults(false);
  };

  const addRetake = () => {
    setRetakes([...retakes, { credit: '', newGrade: '', oldGrade: '' }]);
    setShowResults(false);
  };

  const updateCourse = (index, field, value) => {
    const newCourses = [...courses];
    newCourses[index][field] = value;
    setCourses(newCourses);
    setShowResults(false);
  };

  const updateRetake = (index, field, value) => {
    const newRetakes = [...retakes];
    newRetakes[index][field] = value;
    setRetakes(newRetakes);
    setShowResults(false);
  };

  const removeCourse = (index) => {
    setCourses(courses.filter((_, i) => i !== index));
    setShowResults(false);
  };

  const removeRetake = (index) => {
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
        totalPoints += Number(retake.credit) * (gradePoints[retake.newGrade] - (retake.oldGrade ? gradePoints[retake.oldGrade] : 0));
      }
    });
    
    return totalCredits > 0 ? totalPoints / totalCredits : 0;
  };

  const calculateCGPA = () => {
    if (completedCredit === undefined || currentCGPA === undefined) return 0;
    
    const currentPoints = currentCGPA * completedCredit;
    const newPoints = calculateGPA() * courses.reduce((sum, course) => sum + (course.credit ? Number(course.credit) : 0), 0);
    const totalCredits = completedCredit + courses.reduce((sum, course) => sum + (course.credit ? Number(course.credit) : 0), 0);
    
    return totalCredits > 0 ? (currentPoints + newPoints) / totalCredits : 0;
  };

  return (
    <div className="min-h-screen bg-black text-white p-3 sm:p-6">
      <div className="max-w-3xl mx-auto">
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
          <div className="bg-gray-900 p-3 sm:p-4 rounded-lg">
            <label className="block mb-2 text-sm sm:text-base">Completed Credits</label>
            <input
              type="number"
              value={completedCredit || ''}
              onChange={(e) => setCompletedCredit(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Enter completed credits"
              className="w-full bg-gray-800 text-white p-2 rounded border border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500 text-sm sm:text-base"
            />
          </div>
          <div className="bg-gray-900 p-3 sm:p-4 rounded-lg">
            <label className="block mb-2 text-sm sm:text-base">Current CGPA</label>
            <input
              type="number"
              step="0.01"
              max="4.00"
              value={currentCGPA || ''}
              onChange={(e) => setCurrentCGPA(e.target.value ? Number(e.target.value) : undefined)}
              placeholder="Enter current CGPA"
              className="w-full bg-gray-800 text-white p-2 rounded border border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 placeholder-gray-500 text-sm sm:text-base"
            />
          </div>
        </div>

        <div className="bg-gray-900 p-3 sm:p-6 rounded-lg mb-4 sm:mb-6">
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
            <div key={index} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 bg-gray-800 p-3 sm:p-4 rounded-lg">
              <div className="flex-1">
                <label className="block mb-1 text-sm sm:text-base">Credits</label>
                <select
                  value={course.credit}
                  onChange={(e) => updateCourse(index, 'credit', e.target.value)}
                  className="w-full bg-gray-700 text-white p-2 rounded border border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
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
                  className="w-full bg-gray-700 text-white p-2 rounded border border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm sm:text-base"
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
                className="self-end bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 inline-flex items-center gap-1 text-[10px]"
              >
                <Trash2 size={10} />
                Remove
              </button>
            </div>
          ))}

          {retakes.map((retake, index) => (
            <div key={`retake-${index}`} className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 bg-blue-900/30 p-3 sm:p-4 rounded-lg">
              <div className="flex-1">
                <label className="block mb-1 text-sm sm:text-base">Credits</label>
                <select
                  value={retake.credit}
                  onChange={(e) => updateRetake(index, 'credit', e.target.value)}
                  className="w-full bg-gray-700 text-white p-2 rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                  className="w-full bg-gray-700 text-white p-2 rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                  className="w-full bg-gray-700 text-white p-2 rounded border border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
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
                className="self-end bg-red-500 text-white px-2 py-0.5 rounded hover:bg-red-600 transition-all duration-300 transform hover:scale-105 hover:shadow-lg active:scale-95 inline-flex items-center gap-1 text-[10px]"
              >
                <Trash2 size={10} />
                Remove
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
          <div className="bg-gray-900 p-3 sm:p-6 rounded-lg mt-4 sm:mt-6">
            <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
              <GraduationCap size={24} className="text-orange-500" />
              Results
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-800 p-4 rounded-lg transform hover:scale-105 transition-transform">
                <p className="text-xs sm:text-sm mb-1">Current Semester GPA</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-500">{calculateGPA().toFixed(2)}</p>
              </div>
              <div className="bg-gray-800 p-4 rounded-lg transform hover:scale-105 transition-transform">
                <p className="text-xs sm:text-sm mb-1">Overall CGPA</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-500">{calculateCGPA().toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
