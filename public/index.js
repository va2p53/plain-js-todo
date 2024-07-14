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
 * @property {number} currentTaskIndex = index of last selected task
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
 * @type {number}
 */
let currentTaskIndex = -1;

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
/**@type {HTMLButtonElement} */
const changeTaskTitleButtonElem =
  taskContentElem.querySelector(".change-task-title");
/**@type {HTMLHeadingElement} */
const taskStatusElem = taskContentElem.querySelector(".status");
/**@type {HTMLButtonElement} */
const addSubtaskButtonElem = taskContentElem.querySelector(
  ".add-subtask-button"
);
/**@type {HTMLInputElement} */
const addSubtaskInputElem = taskContentElem.querySelector(".add-subtask-input");

//constant events

addTaskButtonElem.addEventListener("click", onAddNewTask);
addTaskInputElem.addEventListener("keydown", onConfirmTaskNameInput);

addSubtaskButtonElem.addEventListener("click", onAddNewSubtask);
addSubtaskInputElem.addEventListener("keydown", onConfirmSubtaskNameInput);

taskTitleElem.addEventListener("click", onTaskTitleClick);

// load state from store

initializeContent();

/**
 * Wrapper for existing functions to load saved state from store and initialize layout state from it.
 */
function initializeContent() {
  loadTasksFromLocalStore();
  updateTaskList();
  updateCurrentTaskContent();
  visuallySelectTaskElement(getTask(currentTaskIndex)?.id);
}

/**
 * Handles adding of new task to the task list
 */
function onAddNewTask() {
  if (!addTaskInputElem.value) {
    console.log("Task group title is empty.");
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

  const currentTaskId = getTask(currentTaskIndex).id;
  tasks.unshift(newTask);
  currentTaskIndex = tasks.findIndex((item) => item.id === currentTaskId);

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
    const taskIndex = tasks.findIndex((item) => item.id === id);

    if (!task || taskIndex === -1) {
      return;
    }

    currentTaskIndex = taskIndex;

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
    console.log("Task title is empty.");
    return;
  }

  if (!getTask(currentTaskIndex)) {
    console.log("Nowhere to add task, task group is not selected.");
    return;
  }

  createSubtask(addSubtaskInputElem.value, getTask(currentTaskIndex));
  addSubtaskInputElem.value = "";

  updateTaskStatusElem(getTask(currentTaskIndex));
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

    if (taskIndex === currentTaskIndex && currentTaskIndex !== -1) {
      tasks.splice(taskIndex, 1);
      currentTaskIndex = -1;
    } else if (taskIndex !== -1) {
      const currentTaskId = getTask(currentTaskIndex).id;
      tasks.splice(taskIndex, 1);
      currentTaskIndex = tasks.findIndex((item) => item.id === currentTaskId);
    }

    taskElement.remove();
    updateCurrentTaskContent();
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
    getTask(currentTaskIndex)
  ) {
    const id = subtaskElement.getAttribute("data-id");

    const subtaskIndex = getTask(currentTaskIndex).subtasks.findIndex(
      (item) => item.id === id
    );

    if (subtaskIndex !== -1) {
      getTask(currentTaskIndex).subtasks.splice(subtaskIndex, 1);
    }

    subtaskElement.remove();

    updateTaskStatusElem(getTask(currentTaskIndex));

    saveTasksToLocalStore();
  }
}

/**
 * Handles task title click. Creates new input on top of it
 * @param {Event} event
 */
function onTaskTitleClick(event) {
  if (!getTask(currentTaskIndex)) {
    console.log("No actual task group selected, can't change it's title.");
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

    changeListElementTitle(
      event.currentTarget.value,
      getTask(currentTaskIndex).id,
      tasksListElem,
      tasks
    );

    taskTitleElem.textContent = event.currentTarget.value;

    saveTasksToLocalStore();
    event.currentTarget.remove();
  }
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

    changeListElementTitle(
      event.currentTarget.value,
      id,
      subtasksListElem,
      getTask(currentTaskIndex).subtasks
    );

    saveTasksToLocalStore();
    event.currentTarget.remove();
  }
}

/**
 *  Changes title of an element in layout and it's list.
 * @param {string} newTitle
 * @param {string} id
 * @param {Element} elementParent
 * @param {(Task[]|Subtask[])} elementList
 */
function changeListElementTitle(newTitle, id, elementParent, elementList) {
  const index = elementList.findIndex((item) => item.id === id);

  if (index !== -1) {
    elementList[index].title = newTitle;
  }

  for (const child of elementParent.children) {
    if (child.getAttribute("data-id") === id) {
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
  if (!getTask(currentTaskIndex)) {
    console.log("No actual task group selected, can't change it's task title.");
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

  const subtaskIndex = getTask(currentTaskIndex).subtasks.findIndex(
    (item) => item.id === subtaskId
  );

  if (subtaskIndex !== -1) {
    getTask(currentTaskIndex).subtasks[subtaskIndex].status = newStatus;
  }

  updateTaskStatusElem(getTask(currentTaskIndex));
  saveTasksToLocalStore();
}

/**
 * Moves element with elementId to position under targetElement in layout and in it's saved list.
 * @param {Element} elementParent
 * @param {Element} targetElement
 * @param {string} movedElementId
 * @param {(Task[]|Subtask[])} elementList
 */
function moveItem(elementParent, targetElement, movedElementId, elementList) {
  if (!elementList) {
    console.log("Missing list of elements");
  }

  const id = targetElement.getAttribute("data-id");

  const indexOfInserted = elementList.findIndex(
    (item) => item.id === movedElementId
  );

  const indexOfTarget = elementList.findIndex((item) => item.id === id);

  if (indexOfInserted === indexOfTarget + 1) {
    console.log("Elements are on required positions");
    return;
  }

  const insertedElement = elementParent.querySelector(
    `:scope > [data-id="${movedElementId}"]`
  );

  targetElement.after(insertedElement);

  // Offset is to account for that we are supposed to insert element after target element, i.e. shimmy into new place
  // not just swap with another element. Without it after layout loaded from saved state (on reload) it will look like
  // element was inserted before target element when target index lower than index of moved element
  const offset = indexOfInserted > indexOfTarget ? 1 : 0;

  arrayMoveElement(elementList, indexOfInserted, indexOfTarget + offset);
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
 * Handles drop event. Invokes functions to move element to new place in
 * appropriate list. Received payload has ID of moved element and it's "type" to check
 * in which lists it is allowed.
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
      const currentTaskId = getTask(currentTaskIndex).id;
      moveItem(tasksListElem, targetElement, payload.id, tasks);
      currentTaskIndex = tasks.findIndex((item) => item.id === currentTaskId);
      break;
    case "subtask":
      moveItem(
        subtasksListElem,
        targetElement,
        payload.id,
        getTask(currentTaskIndex).subtasks
      );
      break;
    default:
      break;
  }

  saveTasksToLocalStore();
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
    currentTaskIndex,
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

    if (lastState?.tasks) {
      tasks = lastState.tasks;
    }

    if (lastState?.currentTaskIndex !== undefined) {
      currentTaskIndex = lastState.currentTaskIndex;
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

  const children = [titleElem, buttonElem];

  elem.append(...children);

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

  const children = [checkBoxElem, titleElem, editButtonElem, buttonElem];

  elem.append(...children);

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
  if (currentTaskIndex !== -1) {
    taskContentElem.classList.remove("hidden");

    taskTitleElem.textContent = getTask(currentTaskIndex).title;

    const task = getTask(currentTaskIndex);

    updateTaskStatusElem(task);

    let newSubTasks = [];

    task.subtasks.forEach((item) => {
      const subtask = createSubtaskElement(item.title, item.id, item.status);
      newSubTasks.push(subtask);
    });

    subtasksListElem.replaceChildren(...newSubTasks);
  } else {
    taskTitleElem.textContent = "Выберите список";
    taskStatusElem.textContent = "Не доступно";
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
  taskStatusElem.textContent = `Всего: ${statistic.total}. Готово: ${statistic.done}.`;
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

/**
 * Returns reference to task from tasks
 * @param {number} i taskIndex
 * @returns
 */
function getTask(i) {
  return tasks[i] ?? null;
}
