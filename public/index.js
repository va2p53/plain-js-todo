/**
 * Subtask of a task.
 * @typedef {Object} Subtask
 * @property {boolean} status - indicates if subtask is done
 * @property {string} title - title of subtask
 * @property {string} id - unique id
 */

/**
 * A record of task.
 * @typedef {Object} Task
 * @property {string} title - title of a task
 * @property {Subtask[]} subtasks - array of subtasks
 * @property {string} id - unique id
 */

/**
 * State saved into local storage
 * @typedef {Object} SavedState
 * @property {Task} currentTask - last selected task
 * @property {Task[]} tasks - last task list
 */

/**
 * @typedef {Object} DragDataTransferPayload
 * @property {string} id id of an element dropped
 * @property {string} type data-type of element dropped
 */

/**
 * @type {Task[]}
 */
let tasks = [];

/**
 * @type {Task}
 */
let currentTask = null;

const APP_ID = "TASKS_MANANGER_V1_B0828055";

//constant selectors
/**@type {HTMLDivElement} */
const tasksMenuElem = document.querySelector(".tasks");
/**@type {HTMLButtonElement} */
const addTaskButtonElem = tasksMenuElem.querySelector(".add-task-button");
/**@type {HTMLInputElement} */
const addTaskInputElem = tasksMenuElem.querySelector(".add-task-input");
/**@type {HTMLUListElement} */
const tasksListElem = tasksMenuElem.querySelector(".tasks-list");

/**@type {HTMLDivElement} */
const taskContentElem = document.querySelector(".task-content");
/**@type {HTMLUListElement} */
const subtasksListElem = taskContentElem.querySelector(".subtasks-list");
/**@type {HTMLHeadingElement} */
const taskTitleElem = taskContentElem.querySelector(":scope > .title");
/**@type {HTMLHeadingElement} */
const taskStatusElem = taskContentElem.querySelector(".status");
/**@type {HTMLButtonElement} */
const addSubtaskButtonElem = taskContentElem.querySelector(
  ".add-subtask-button"
);
/**@type {HTMLInputElement} */
const addSubtaskInputElem = taskContentElem.querySelector(".add-subtask-input");
/**@type {HTMLButtonElement} */
const changeTaskTitleButtonElem =
  taskContentElem.querySelector(".change-task-title");

//constant events

addTaskButtonElem.addEventListener("click", onAddNewTask);
addTaskInputElem.addEventListener("keydown", onConfirmTaskNameInput);

addSubtaskButtonElem.addEventListener("click", onAddNewSubtask);
addSubtaskInputElem.addEventListener("keydown", onConfirmSubtaskNameInput);

taskTitleElem.addEventListener("click", onTaskTitleClick);

// load state from store

loadTasksFromLocalStore();
updateTaskList();
updateCurrentTaskContent();
visuallySelectTaskElement(currentTask?.id);

// tasks

/**
 * Handles adding of new task to the task list
 */
function onAddNewTask() {
  if (!addTaskInputElem.value) {
    console.log("Task title is empty. Cancel new task.");
    return;
  }

  createTask(addTaskInputElem.value);
  addTaskInputElem.value = "";
}

/**
 * Invokes onAddNewTask if enter was pressed in target
 * @param {Event} event keypress event
 */
function onConfirmTaskNameInput(event) {
  if (event.key === "Enter") {
    onAddNewTask();
  }
}

/**
 * Creates new task as task list element and in tasks local
 * value
 * @param {string} title new task title
 */
function createTask(title) {
  /** @type {Task} */
  const newTask = {
    title: title,
    id: generateUid(),
    subtasks: [],
  };

  tasks.unshift(newTask);

  const taskElem = createTaskElement(newTask.title, newTask.id);

  tasksListElem.prepend(taskElem);
  saveTasksToLocalStore();
}

/**
 * Switches to clicked task
 * @param {Event} event click event
 */
function onClickTask(event) {
  if (event.target.classList.contains("remove-task-button")) {
    return;
  }

  /**@type {HTMLDivElement} */
  const element = event.currentTarget;

  const id = element.getAttribute("data-id");

  if (id) {
    const task = tasks.find((item) => item.id === id);

    if (!task) {
      return;
    }

    currentTask = task;

    visuallySelectTaskElement(id);

    updateCurrentTaskContent();
    saveTasksToLocalStore();
  }
}

/**
 * Invokes onAddNewSubtask if enter was pressed in target
 * @param {Event} event keypress event
 */
function onConfirmSubtaskNameInput(event) {
  if (event.key === "Enter") {
    onAddNewSubtask();
  }
}

/**
 * Handles adding of new subtask to task
 */
function onAddNewSubtask() {
  if (!addSubtaskInputElem.value) {
    console.log("Subtask title is empty.");
    return;
  }

  if (!currentTask) {
    console.log("Nowhere to add subtask, task is not selected.");
    return;
  }

  createSubtask(addSubtaskInputElem.value, currentTask);
  addSubtaskInputElem.value = "";

  replaceTaskInTasks(currentTask);

  updateTaskStatusElem(currentTask);
  saveTasksToLocalStore();
}

/**
 * Creates new subtask in task, updates task
 * @param {string} title title of new subtask
 * @param {Task} parentTask parent task
 */
function createSubtask(title, parentTask) {
  /** @type {Subtask} */
  const newSubTask = {
    title: title,
    id: generateUid(),
    status: false,
  };

  parentTask.subtasks.unshift(newSubTask);

  const subtaskElem = createSubtaskElement(newSubTask.title, newSubTask.id);

  subtasksListElem.prepend(subtaskElem);
}

/**
 * Handles removing of task from task list
 * @param {Event} event button click
 */
function onRemoveTask(event) {
  /**@type {HTMLDivElement} */
  const taskElement = event.currentTarget.parentElement;
  if (taskElement && taskElement?.classList.contains("task")) {
    const id = taskElement.getAttribute("data-id");
    const taskIndex = tasks.findIndex((item) => item.id === id);

    if (taskIndex !== -1) {
      tasks.splice(taskIndex, 1);
    }

    taskElement.remove();

    if (currentTask && currentTask.id === id) {
      currentTask = null;
      updateCurrentTaskContent();
    }
    saveTasksToLocalStore();
  }
}

/**
 * Handles removing of subtask from task
 * @param {Event} event button click
 */
function onRemoveSubtask(event) {
  /**@type {HTMLDivElement} */
  const subtaskElement = event.currentTarget.parentElement;
  if (
    subtaskElement &&
    subtaskElement?.classList.contains("subtask") &&
    currentTask
  ) {
    const id = subtaskElement.getAttribute("data-id");

    const subtaskIndex = currentTask.subtasks.findIndex(
      (item) => item.id === id
    );

    if (subtaskIndex !== -1) {
      currentTask.subtasks.splice(subtaskIndex, 1);
    }

    subtaskElement.remove();

    replaceTaskInTasks(currentTask);

    updateTaskStatusElem(currentTask);
  }
}

/**
 * Handles task title click. Creates new input on top of it
 * @param {Event} event
 */
function onTaskTitleClick(event) {
  if (!currentTask) {
    console.log("No actual task selected, can't change it's title.");
    return;
  }

  if (event.target !== event.currentTarget) {
    return;
  }

  const newInput = createTextInputElement(["covering-input"]);
  newInput.addEventListener("focusout", onCancelTitleChange);
  newInput.addEventListener("keydown", onConfirmTitleChange);

  taskTitleElem.appendChild(newInput);
  newInput.focus();
}

/**
 * Applies title change if enter pressed
 * @param {Event} event
 */
function onConfirmTitleChange(event) {
  if (event.key === "Enter") {
    if (!event.currentTarget.value) {
      console.log("Input is empty, can't change title.");
    }
    changeTaskTitle(event.currentTarget.value);

    event.currentTarget.remove();
  }
}

/**
 * Changes task title, updates layout.
 * @param {string} newTitle
 */
function changeTaskTitle(newTitle) {
  currentTask.title = newTitle;

  replaceTaskInTasks(currentTask);

  taskTitleElem.textContent = newTitle;

  for (const child of tasksListElem.children) {
    if (child.getAttribute("data-id") === currentTask.id) {
      const childTitle = child.querySelector(".title");
      if (childTitle) {
        childTitle.textContent = newTitle;
      }
    }
  }
}

/**
 * Handles subtask edit event
 * @param {Event} event
 */
function onEditSubtaskClickHandler(event) {
  if (!currentTask) {
    console.log("No actual task selected, can't change it's subtask title.");
    return;
  }

  if (event.target !== event.currentTarget) {
    return;
  }

  const newInput = createTextInputElement(["covering-input"]);
  newInput.addEventListener("focusout", onCancelTitleChange);
  newInput.addEventListener("keydown", onConfirmSubtaskTitleChange);

  event.currentTarget.parentElement.appendChild(newInput);
  newInput.focus();
}

/**
 * Applies title change if enter pressed
 * @param {Event} event
 */
function onConfirmSubtaskTitleChange(event) {
  if (event.key === "Enter") {
    if (!event.currentTarget.value) {
      console.log("Input is empty, can't change title.");
    }
    const id = event.currentTarget.parentElement.getAttribute("data-id");

    changeSubtaskTitle(event.currentTarget.value, id);

    event.currentTarget.remove();
  }
}

/**
 *
 * @param {string} newTitle
 * @param {string} subtaskId
 */
function changeSubtaskTitle(newTitle, subtaskId) {
  const subtaskIndex = currentTask.subtasks.findIndex(
    (item) => item.id === subtaskId
  );

  if (subtaskIndex !== -1) {
    currentTask.subtasks[subtaskIndex].title = newTitle;

    replaceTaskInTasks(currentTask);
  }

  for (const child of subtasksListElem.children) {
    if (child.getAttribute("data-id") === subtaskId) {
      const title = child.querySelector(".title");
      title.textContent = newTitle;
    }
  }
  saveTasksToLocalStore();
}

/**
 * Cancels title change and removes input
 * @param {Event} event
 */
function onCancelTitleChange(event) {
  event.currentTarget.remove();
}

/**
 * Handles change of subtask status
 * @param {Event} event checkbox change
 */
function onChangeSubtaskStatus(event) {
  const newStatus = event.currentTarget.checked;

  const subtaskId = event.currentTarget.parentElement.getAttribute("data-id");

  const subtaskIndex = currentTask.subtasks.findIndex(
    (item) => item.id === subtaskId
  );

  if (subtaskIndex !== -1) {
    currentTask.subtasks[subtaskIndex].status = newStatus;

    replaceTaskInTasks(currentTask);
  }

  updateTaskStatusElem(currentTask);
  saveTasksToLocalStore();
}

/**
 * Reinserts task under element in layout and task list
 * @param {HTMLDivElement} element
 * @param {string} insertedTaskId
 */
function reinsertTaskUnder(element, insertedElementId) {
  const id = element.getAttribute("data-id");

  const indexOfInserted = tasks.findIndex(
    (item) => item.id === insertedElementId
  );
  const indexOfTarget = tasks.findIndex((item) => item.id === id);
  console.log(indexOfInserted, indexOfTarget);

  if (indexOfInserted === indexOfTarget + 1) {
    console.log("Elements are on required positions");
    return;
  }

  const insertedElement = tasksListElem.querySelector(
    `:scope > [data-id="${insertedElementId}"]`
  );

  element.after(insertedElement);

  if (indexOfInserted > indexOfTarget) {
    // Account that we are supposed to insert element before
    // otherwise we just insert it on same position as target.
    // Which in layout looks like it inserted after target when
    // Target index lower than index of element
    arrayMoveElement(tasks, indexOfInserted, indexOfTarget + 1);
  } else {
    arrayMoveElement(tasks, indexOfInserted, indexOfTarget);
  }

  saveTasksToLocalStore();
}

/**
 * Reinserts subtask under another task in layout and in tasks.
 * @param {HTMLDivElement} element
 * @param {string} insertedSubtaskId
 */
function reinsertSubtaskUnder(element, insertedElementId) {
  const id = element.getAttribute("data-id");

  const indexOfInserted = currentTask.subtasks.findIndex(
    (item) => item.id === insertedElementId
  );
  const indexOfTarget = currentTask.subtasks.findIndex(
    (item) => item.id === id
  );

  if (indexOfInserted === indexOfTarget + 1) {
    console.log("Elements are on required positions");
    return;
  }

  const insertedElement = subtasksListElem.querySelector(
    `:scope > [data-id="${insertedElementId}"]`
  );

  element.after(insertedElement);

  if (indexOfInserted > indexOfTarget) {
    // Account that we are supposed to insert element before
    // otherwise we just insert it on same position as target.
    // Which in layout looks like it inserted after target when
    // Target index lower than index of element
    arrayMoveElement(currentTask.subtasks, indexOfInserted, indexOfTarget + 1);
  } else {
    arrayMoveElement(currentTask.subtasks, indexOfInserted, indexOfTarget);
  }

  replaceTaskInTasks(currentTask);
  saveTasksToLocalStore();
}

// Drag'n'drop

/**
 * Handles dragend event
 * @param {DragEvent} event
 */
function onDragEnd(event) {
  event.currentTarget.classList.remove("dragged");
}

/**
 * Handles drop event. Invokes functions to move element in
 * appropriate list.
 * @param {DragEvent} event
 */
function onDrop(event) {
  /** @type {HTMLDivElement} */
  const targetElement = event.currentTarget;
  targetElement.classList.remove("drag-over");

  const targetType = targetElement.getAttribute("data-type");
  const targetId = targetElement.getAttribute("data-id");

  const payloadString = event.dataTransfer.getData("text/plain");
  /** @type {DragDataTransferPayload} */
  const payload = JSON.parse(payloadString);

  if (!payload) {
    return;
  }

  if (targetId === payload.id) {
    console.log("Can't insert under itself.");
    return;
  }

  const validTypes = ["task", "subtask"];

  if (!validTypes.includes(targetType) || !validTypes.includes(payload.type)) {
    console.log("Drag'n'drop with wrong element.");
    return;
  }

  if (targetType !== payload.type) {
    console.log("Can't insert in different list.");
    return;
  }

  switch (targetType) {
    case "task":
      reinsertTaskUnder(targetElement, payload.id);
      break;
    case "subtask":
      reinsertSubtaskUnder(targetElement, payload.id);
      break;
    default:
      break;
  }
}

/**
 * Handles dragleave event
 * @param {DragEvent} event
 */
function onDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

/**
 * Handles dragover event
 * @param {DragEvent} event
 */
function onDragOver(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

/**
 * Handles dragenter event
 * @param {DragEvent} event
 */
function onDragEnter(event) {
  event.preventDefault();
  event.currentTarget.classList.add("drag-over");
}

/**
 *  Handles dragstart event. Sets payload with id and classlist.
 * @param {DragEvent} event
 */
function onDragStart(event) {
  const id = event.target.getAttribute("data-id");
  const type = event.target.getAttribute("data-type");

  /** @type {DragDataTransferPayload} */
  const load = { id, type };

  event.dataTransfer.setData("text/plain", JSON.stringify(load));

  setTimeout(() => {
    event.target.classList.add("dragged");
  }, 0);
}

// Persistence

/**
 * Saves Tasks to localStore
 */
function saveTasksToLocalStore() {
  /** @type {SavedState} */
  const newState = {
    tasks,
    currentTask,
  };
  const newStateString = JSON.stringify(newState);
  localStorage.setItem(APP_ID, newStateString);
}

/**
 * loads Tasks from local store
 */
function loadTasksFromLocalStore() {
  const lastStateString = localStorage.getItem(APP_ID);

  if (lastStateString) {
    /** @type {SavedState} */
    let lastState = null;

    try {
      lastState = JSON.parse(lastStateString);
    } catch (err) {
      console.error(err);
      return;
    }

    if (lastState?.currentTask) {
      currentTask = lastState.currentTask;
    }

    if (lastState?.tasks) {
      tasks = lastState.tasks;
    }
  }
}

// Element creators

/**
 * Creates new task dom element and returns it.
 * @param {string} title task title
 * @param {string} id task uid
 * @returns new Task element
 */
function createTaskElement(title, id) {
  const elem = document.createElement("div");
  elem.classList.add("task");
  elem.setAttribute("data-id", id);
  elem.setAttribute("data-type", "task");
  elem.setAttribute("draggable", true);
  elem.setAttribute("data-tooltip", title);
  elem.addEventListener("click", onClickTask);
  elem.addEventListener("dragend", onDragEnd);
  elem.addEventListener("drop", onDrop);
  elem.addEventListener("dragover", onDragOver);
  elem.addEventListener("dragenter", onDragEnter);
  elem.addEventListener("dragleave", onDragLeave);
  elem.addEventListener("dragstart", onDragStart);

  const titleElem = document.createElement("div");
  titleElem.classList.add("title");
  titleElem.textContent = title;

  const buttonElem = document.createElement("button");
  buttonElem.classList.add("remove-task-button");
  buttonElem.textContent = "X";
  buttonElem.addEventListener("click", onRemoveTask);

  elem.appendChild(titleElem);
  elem.appendChild(buttonElem);

  return elem;
}

/**
 * Creates new subtask dom element and returns it
 * @param {string} title subtask title
 * @param {string} id subtask uid
 * @param {boolean} [status=false] subtask initial status
 * @returns new Subtask element
 */
function createSubtaskElement(title, id, status = false) {
  const elem = document.createElement("div");
  elem.classList.add("subtask");
  elem.setAttribute("data-id", id);
  elem.setAttribute("data-type", "subtask");
  elem.setAttribute("draggable", true);
  elem.setAttribute("data-tooltip", title);
  elem.addEventListener("dragend", onDragEnd);
  elem.addEventListener("drop", onDrop);
  elem.addEventListener("dragover", onDragOver);
  elem.addEventListener("dragenter", onDragEnter);
  elem.addEventListener("dragleave", onDragLeave);
  elem.addEventListener("dragstart", onDragStart);

  const checkBoxElem = document.createElement("input");
  checkBoxElem.setAttribute("type", "checkbox");
  checkBoxElem.classList.add("subtask_checkbox");
  checkBoxElem.checked = status;
  checkBoxElem.addEventListener("change", onChangeSubtaskStatus);

  const titleElem = document.createElement("div");
  titleElem.classList.add("title");
  titleElem.textContent = title;

  const editButtonElem = document.createElement("button");
  editButtonElem.classList.add("edit-subtask-button");
  editButtonElem.addEventListener("click", onEditSubtaskClickHandler);
  editButtonElem.textContent = "E";

  const buttonElem = document.createElement("button");
  buttonElem.classList.add("remove-subtask-button");
  buttonElem.addEventListener("click", onRemoveSubtask);
  buttonElem.textContent = "X";

  elem.appendChild(checkBoxElem);
  elem.appendChild(titleElem);
  elem.appendChild(editButtonElem);
  elem.appendChild(buttonElem);

  return elem;
}

/**
 * Creates new text input element with set classes
 * @param {string[]} [classList = []] array of classes
 * @returns new text input element
 */
function createTextInputElement(classList = []) {
  const elem = document.createElement("input");
  elem.setAttribute("type", "text");
  elem.classList.add(classList);

  return elem;
}

// utils

/**
 * Generates uid. Security and lack of collisions is NOT guaranteed.
 */
function generateUid() {
  return "id" + new Date().getTime() + Math.random().toString(16);
}

/**
 * Generates statistics of given task
 * @param {Task} task
 * @returns statistics of task
 */
function getTaskStatistic(task) {
  let statistic = { done: 0, total: 0 };

  statistic.total = task.subtasks.length;

  task.subtasks.forEach((item) => {
    if (item.status === true) {
      statistic.done += 1;
    }
  });

  return statistic;
}

/**
 * Looks through Tasks for task with matching id
 * and replaces it.
 * @param {Task} task
 */
function replaceTaskInTasks(task) {
  tasks = tasks.map((item) => (item.id === task.id ? task : item));
}

/**
 * Moves element in array from one index to another.
 * Mutates array. Does nothing if any of indexes outside of
 * array's bounds or equal to each other.
 * @param {*[]} array
 * @param {number} sourceIndex
 * @param {number} targetIndex
 */
function arrayMoveElement(array, sourceIndex, targetIndex) {
  if (sourceIndex === targetIndex) {
    return;
  }

  if (sourceIndex >= array.length || sourceIndex < 0) {
    return;
  }

  if (targetIndex >= array.length || targetIndex < 0) {
    return;
  }

  array.splice(targetIndex, 0, array.splice(sourceIndex, 1)[0]);
}

/**
 * Updates layout of current task according to current task
 * Makes task content invisible if current task is empty
 */
function updateCurrentTaskContent() {
  if (currentTask) {
    taskContentElem.classList.remove("hidden");

    taskTitleElem.textContent = currentTask.title;

    updateTaskStatusElem(currentTask);

    let newSubTasks = [];

    currentTask.subtasks.forEach((item) => {
      const subtask = createSubtaskElement(item.title, item.id, item.status);
      newSubTasks.push(subtask);
    });

    subtasksListElem.replaceChildren(...newSubTasks);
  } else {
    taskTitleElem.textContent = "Not selected";
    taskStatusElem.textContent = "Not available";
    subtasksListElem.replaceChildren();

    taskContentElem.classList.add("hidden");
  }
}

/**
 * Updates layout of tasks list according to current task list data.
 */
function updateTaskList() {
  /**@type {HTMLDivElement[]} */
  const newTasks = [];

  tasks.forEach((item) => {
    const newTask = createTaskElement(item.title, item.id);
    newTasks.push(newTask);
  });

  tasksListElem.replaceChildren(...newTasks);
}

/**
 * Updates task status element with data from task
 * @param {Task} task task to update status
 */
function updateTaskStatusElem(task) {
  const statistic = getTaskStatistic(task);
  taskStatusElem.textContent = `Subtasks: ${statistic.total}. Done: ${statistic.done}.`;
}

/**
 * Visually selects task element in tasks list
 * @param {string} id
 */
function visuallySelectTaskElement(id) {
  if (!id) {
    return;
  }

  for (const child of tasksListElem.children) {
    if (child.getAttribute("data-id") === id) {
      child.classList.add("selected");
    } else {
      child.classList.remove("selected");
    }
  }
}
