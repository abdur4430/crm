(() => {
  const thisDate = new Date();
  const forms = document.querySelectorAll('.needs-validation');
  const studentTable = document.getElementById('tableBody');
  const addForm = document.querySelector('.add__form');
  const studentName = document.getElementById('addName');
  const studentSurname = document.getElementById('addSurname');
  const studentFatherName = document.getElementById('addFathername');
  const studentBirthDay = document.getElementById('addBoD');
  const studentStartLearning = document.getElementById('addReceipt');
  const studentFaculty = document.getElementById('addFaculty');
  const studentFullNameSort = document.getElementById('fullNameSort');
  const studentFacultySort = document.getElementById('facultySort');
  const studentBirthSort = document.getElementById('birthSort');
  const studentLearningSort = document.getElementById('learningSort');
  const filterForm = document.querySelector('.filter__form');
  const studentFullNameFilter = document.getElementById('filterFullname');
  const studentStartFilter = document.getElementById('filterStart');
  const studentFinishFilter = document.getElementById('filterFinish');
  const studentFacultyFilter = document.getElementById('filterFaculty');
  let dir = true;
  let tempList = [];

  async function updateList() {
    const request = await fetch('http://localhost:3000/api/students');
    const studentItemList = await request.json();
    tempList = [...studentItemList];
    return tempList;
  }

  function getStudentItem(studentObj) {
    const studentString = document.createElement('tr');
    const cellFullname = document.createElement('td');
    const cellFaculty = document.createElement('td');
    const cellBirdth = document.createElement('td');
    const cellLearning = document.createElement('td');
    const cellButton = document.createElement('td');
    const deleteButton = document.createElement('button');
    const birthDay = new Date(studentObj.birthday).getDate();
    const birthMonth = new Date(studentObj.birthday).getMonth() + 1;
    const birthYear = new Date(studentObj.birthday).getFullYear();
    const fullYear = Math.round((thisDate - new Date(studentObj.birthday)) * 0.000000000031688738506811);
    const studyStart = Number(studentObj.studyStart);
    const finishLearn = Number(studentObj.studyStart) + 4;

    deleteButton.classList.add('btn', 'btn-danger');
    deleteButton.textContent = 'Delete';

    if (Number(studentObj.studyStart) + 4 > thisDate.getFullYear()) {
      cellLearning.textContent = `${studyStart}-${finishLearn} (${thisDate.getFullYear() - studyStart} Курс)`;
    } else if (thisDate.getMonth() < 8 && thisDate.getFullYear() === finishLearn) {
      cellLearning.textContent = `${studyStart}-${finishLearn} (4 Курс)`;
    } else {
      cellLearning.textContent = `${studyStart}-${finishLearn} (Finished)`;
    }

    cellFullname.textContent = studentObj.surname + ' ' + studentObj.name + ' ' + studentObj.lastname;
    studentString.append(cellFullname);
    cellFaculty.textContent = studentObj.faculty;
    studentString.append(cellFaculty);
    cellBirdth.textContent = `${birthDay}.${birthMonth}.${birthYear} (${fullYear})`;
    studentString.append(cellBirdth);
    studentString.append(cellLearning);
    cellButton.append(deleteButton);
    studentString.append(cellButton);
    studentTable.append(studentString);

    deleteButton.addEventListener('click', () => {
      if (confirm('Are You sure?')) {
        fetch(`http://localhost:3000/api/students/${studentObj.id}`, {
          method: 'DELETE',
        });
      }
      window.location.reload();
    });

    return {
      studentTable,
      studentString,
      cellFullname,
      cellFaculty,
      cellBirdth,
      cellLearning,
    };
  }

  function renderStudentsTable(studentsArray) {
    studentsArray.forEach((studentsItem) => {
      getStudentItem(studentsItem);
    });
    return studentsArray;
  }

  function tableSorting(studentObj, property, dir = false) {
    return studentObj.sort((a, b) => {
      let dirIf = a[property] < b[property];
      if (dir === true) dirIf = a[property] > b[property];
      if (dirIf === true) return -1;
    });
  }

  function tableFilter(studentObj, filterColumn, property1, property2 = 'name', property3 = 'name') {
    const result = [];
    const copy = [...studentObj];
    for (const student of copy) {
      if (student[property1].includes(filterColumn.value) === true) result.push(student);
      if (student[property2].includes(filterColumn.value) === true) result.push(student);
      if (student[property3].includes(filterColumn.value) === true) result.push(student);
    }
    return result.filter((number, index, numbers) => {
      return result.indexOf(number) === index;
    });
  }

  (async function appStart() {
    await updateList();
    renderStudentsTable(tempList);

    addForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (studentName.value
        && studentSurname.value
        && studentFatherName.value
        && studentBirthDay.value
        && studentStartLearning.value
        && studentFaculty.value) {
        const response = await fetch('http://localhost:3000/api/students', {
          method: 'POST',
          body: JSON.stringify({
            name: studentName.value,
            surname: studentSurname.value,
            lastname: studentFatherName.value,
            birthday: new Date(studentBirthDay.value),
            studyStart: studentStartLearning.value,
            faculty: studentFaculty.value,
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const student = await response.json();

        getStudentItem(student);

        studentName.value = '';
        studentSurname.value = '';
        studentFatherName.value = '';
        studentBirthDay.value = '';
        studentStartLearning.value = '';
        studentFaculty.value = '';
      }
      await updateList();
    });

    filterForm.addEventListener('submit', async (e) => {
      await updateList();
      let filtredList = [...tempList];
      e.preventDefault();
      if (studentFullNameFilter.value !== '') {
        filtredList = tableFilter(filtredList, studentFullNameFilter, 'name', 'surname', 'lastname');
        studentFullNameFilter.value = '';
      }
      if (studentStartFilter.value !== '') {
        filtredList = tableFilter(filtredList, studentStartFilter, 'studyStart');
        studentStartFilter.value = '';
      }
      if (studentFinishFilter.value !== '') {
        studentFinishFilter.value -= 4;
        filtredList = tableFilter(filtredList, studentFinishFilter, 'studyStart');
        studentFinishFilter.value = '';
      }
      if (studentFacultyFilter.value !== '') {
        filtredList = tableFilter(filtredList, studentFacultyFilter, 'faculty');
        studentFacultyFilter.value = '';
      }
      studentTable.innerHTML = '';
      renderStudentsTable(filtredList);
      tempList = [...filtredList];
    });

    studentFullNameSort.addEventListener('click', () => {
      tableSorting(tempList, 'surname', dir = !dir);
      studentTable.innerHTML = '';
      renderStudentsTable(tempList);
    });

    studentFacultySort.addEventListener('click', () => {
      tableSorting(tempList, 'faculty', dir = !dir);
      studentTable.innerHTML = '';
      renderStudentsTable(tempList);
    });

    studentBirthSort.addEventListener('click', () => {
      tableSorting(tempList, 'birthday', dir = !dir);
      studentTable.innerHTML = '';
      renderStudentsTable(tempList);
    });

    studentLearningSort.addEventListener('click', () => {
      tableSorting(tempList, 'studyStart', dir = !dir);
      studentTable.innerHTML = '';
      renderStudentsTable(tempList);
    });
  }());

  Array.from(forms).forEach((form) => {
    form.addEventListener(
      'submit',
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add('was-validated');
      },
      false,
    );
  });
})();
