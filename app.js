(function () {
  'use strict';

  const STORAGE_KEY = 'employee-management-data';

  var employees = [];
  var nextId = 1;
  var editingId = null;

  var form = document.getElementById('employeeForm');
  var formTitle = document.getElementById('formTitle');
  var submitBtn = document.getElementById('submitBtn');
  var resetBtn = document.getElementById('resetBtn');
  var emptyMessage = document.getElementById('emptyMessage');
  var employeeTable = document.getElementById('employeeTable');
  var tableBody = document.getElementById('tableBody');

  var fields = {
    name: document.getElementById('name'),
    email: document.getElementById('email'),
    address: document.getElementById('address'),
    phone: document.getElementById('phone'),
    designation: document.getElementById('designation'),
  };

  var errorEls = {
    name: document.getElementById('errorName'),
    email: document.getElementById('errorEmail'),
    address: document.getElementById('errorAddress'),
    phone: document.getElementById('errorPhone'),
    gender: document.getElementById('errorGender'),
    hobbies: document.getElementById('errorHobbies'),
    designation: document.getElementById('errorDesignation'),
  };

  function getSelectedGender() {
    var radio = form.querySelector('input[name="gender"]:checked');
    return radio ? radio.value : '';
  }

  function getSelectedHobbies() {
    var checkboxes = form.querySelectorAll('input[name="hobby"]:checked');
    return Array.prototype.map.call(checkboxes, function (cb) { return cb.value; });
  }

  function setGender(value) {
    var radio = form.querySelector('input[name="gender"][value="' + value + '"]');
    if (radio) radio.checked = true;
  }

  function setHobbies(values) {
    form.querySelectorAll('input[name="hobby"]').forEach(function (cb) {
      cb.checked = values.indexOf(cb.value) !== -1;
    });
  }

  // --- Validation (plain JavaScript) ---
  function validateName() {
    var v = (fields.name.value || '').trim();
    if (!v) return 'Name is required.';
    if (v.length < 2) return 'Name must be at least 2 characters.';
    return '';
  }

  function validateEmail() {
    var v = (fields.email.value || '').trim();
    if (!v) return 'Email is required.';
    var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(v)) return 'Please enter a valid email.';
    return '';
  }

  function validateAddress() {
    var v = (fields.address.value || '').trim();
    if (!v) return 'Address is required.';
    if (v.length < 5) return 'Address must be at least 5 characters.';
    return '';
  }

  function validatePhone() {
    var v = (fields.phone.value || '').trim();
    if (!v) return 'Phone Number is required.';
    var digits = v.replace(/\D/g, '');
    if (digits.length < 10) return 'Phone must have at least 10 digits.';
    return '';
  }

  function validateGender() {
    if (!getSelectedGender()) return 'Gender is required.';
    return '';
  }

  function validateHobbies() {
    if (getSelectedHobbies().length === 0) return 'Select at least one hobby.';
    return '';
  }

  function validateDesignation() {
    if (!(fields.designation.value || '').trim()) return 'Designation is required.';
    return '';
  }

  var validators = {
    name: validateName,
    email: validateEmail,
    address: validateAddress,
    phone: validatePhone,
    gender: validateGender,
    hobbies: validateHobbies,
    designation: validateDesignation,
  };

  function showError(fieldName, message) {
    var el = errorEls[fieldName];
    if (el) {
      el.textContent = message || '';
      el.style.display = message ? 'block' : 'none';
    }
  }

  function validateField(fieldName) {
    var fn = validators[fieldName];
    var msg = fn ? fn() : '';
    showError(fieldName, msg);
    return msg === '';
  }

  function validateAll() {
    var valid = true;
    Object.keys(validators).forEach(function (key) {
      if (!validateField(key)) valid = false;
    });
    return valid;
  }

  function isFormValid() {
    return Object.keys(validators).every(function (key) {
      return validators[key]() === '';
    });
  }

  function updateSubmitButton() {
    submitBtn.disabled = !isFormValid();
    submitBtn.textContent = editingId !== null ? 'Update' : 'Submit';
  }

  // --- Storage ---
  function loadFromStorage() {
    try {
      var raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) {
        var data = JSON.parse(raw);
        employees = data.employees || [];
        nextId = data.nextId || 1;
      } else {
        employees = [];
        nextId = 1;
      }
    } catch (e) {
      employees = [];
      nextId = 1;
    }
  }

  function saveToStorage() {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ employees: employees, nextId: nextId }));
  }

  // --- Form data ---
  function getFormData() {
    return {
      name: (fields.name.value || '').trim(),
      email: (fields.email.value || '').trim(),
      address: (fields.address.value || '').trim(),
      phone: (fields.phone.value || '').trim(),
      gender: getSelectedGender(),
      hobbies: getSelectedHobbies(),
      designation: (fields.designation.value || '').trim(),
    };
  }

  function setFormData(emp) {
    fields.name.value = emp.name || '';
    fields.email.value = emp.email || '';
    fields.address.value = emp.address || '';
    fields.phone.value = emp.phone || '';
    fields.designation.value = emp.designation || '';
    setGender(emp.gender || '');
    setHobbies(emp.hobbies || []);
    Object.keys(errorEls).forEach(function (key) { showError(key, ''); });
    updateSubmitButton();
  }

  function clearForm() {
    fields.name.value = '';
    fields.email.value = '';
    fields.address.value = '';
    fields.phone.value = '';
    fields.designation.value = '';
    setGender('');
    setHobbies([]);
    editingId = null;
    formTitle.textContent = 'Add Employee';
    Object.keys(errorEls).forEach(function (key) { showError(key, ''); });
    updateSubmitButton();
  }

  // --- Table render ---
  function renderTable() {
    tableBody.innerHTML = '';
    if (employees.length === 0) {
      emptyMessage.style.display = 'block';
      employeeTable.hidden = true;
      return;
    }
    emptyMessage.style.display = 'none';
    employeeTable.hidden = false;

    employees.forEach(function (emp) {
      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + escapeHtml(emp.name) + '</td>' +
        '<td>' + escapeHtml(emp.email) + '</td>' +
        '<td>' + escapeHtml(emp.address) + '</td>' +
        '<td>' + escapeHtml(emp.phone) + '</td>' +
        '<td>' + escapeHtml(emp.gender) + '</td>' +
        '<td>' + escapeHtml((emp.hobbies || []).join(', ')) + '</td>' +
        '<td>' + escapeHtml(emp.designation) + '</td>' +
        '<td class="actions-cell">' +
        '<button type="button" class="btn-edit" data-action="edit" data-id="' + emp.id + '">Edit</button> ' +
        '<button type="button" class="btn-delete" data-action="delete" data-id="' + emp.id + '">Delete</button>' +
        '</td>';
      tableBody.appendChild(tr);
    });

    tableBody.querySelectorAll('[data-action="edit"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(btn.getAttribute('data-id'), 10);
        var emp = employees.filter(function (e) { return e.id === id; })[0];
        if (emp) onEdit(emp);
      });
    });
    tableBody.querySelectorAll('[data-action="delete"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = parseInt(btn.getAttribute('data-id'), 10);
        var emp = employees.filter(function (e) { return e.id === id; })[0];
        if (emp) onDelete(emp);
      });
    });
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function onSubmit(e) {
    e.preventDefault();
    if (!validateAll()) return;

    var data = getFormData();
    if (editingId !== null) {
      employees = employees.map(function (emp) {
        return emp.id === editingId ? { id: emp.id, name: data.name, email: data.email, address: data.address, phone: data.phone, gender: data.gender, hobbies: data.hobbies, designation: data.designation } : emp;
      });
      editingId = null;
    } else {
      employees.push({ id: nextId++, name: data.name, email: data.email, address: data.address, phone: data.phone, gender: data.gender, hobbies: data.hobbies, designation: data.designation });
    }
    saveToStorage();
    renderTable();
    clearForm();
  }

  function onEdit(emp) {
    setFormData(emp);
    editingId = emp.id;
    formTitle.textContent = 'Edit Employee';
  }

  function onDelete(emp) {
    if (!confirm('Delete employee "' + emp.name + '"?')) return;
    employees = employees.filter(function (e) { return e.id !== emp.id; });
    saveToStorage();
    renderTable();
    if (editingId === emp.id) clearForm();
  }

  function onReset(e) {
    e.preventDefault();
    clearForm();
  }

  function attachValidationEvents() {
    fields.name.addEventListener('input', function () { validateField('name'); updateSubmitButton(); });
    fields.name.addEventListener('blur', function () { validateField('name'); });
    fields.email.addEventListener('input', function () { validateField('email'); updateSubmitButton(); });
    fields.email.addEventListener('blur', function () { validateField('email'); });
    fields.address.addEventListener('input', function () { validateField('address'); updateSubmitButton(); });
    fields.address.addEventListener('blur', function () { validateField('address'); });
    fields.phone.addEventListener('input', function () { validateField('phone'); updateSubmitButton(); });
    fields.phone.addEventListener('blur', function () { validateField('phone'); });
    fields.designation.addEventListener('change', function () { validateField('designation'); updateSubmitButton(); });
    fields.designation.addEventListener('blur', function () { validateField('designation'); });

    form.querySelectorAll('input[name="gender"]').forEach(function (radio) {
      radio.addEventListener('change', function () { validateField('gender'); updateSubmitButton(); });
    });
    form.querySelectorAll('input[name="hobby"]').forEach(function (cb) {
      cb.addEventListener('change', function () { validateField('hobbies'); updateSubmitButton(); });
    });
  }

  // --- Init ---
  loadFromStorage();
  renderTable();
  updateSubmitButton();
  attachValidationEvents();

  form.addEventListener('submit', onSubmit);
  resetBtn.addEventListener('click', onReset);
})();
