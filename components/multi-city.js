document.querySelectorAll(".mc-inline").forEach((editor) => {
  editor.addEventListener("click", (event) => {
    const action = event.target.closest(".mc-inline__action");
    if (!action || !editor.contains(action)) return;

    const selected = editor.querySelector('.mc-inline__state:checked');
    if (!selected) return;

    // Each row's controls operate on the current route length, not a fixed row number.
    event.preventDefault();
    const currentCount = Number(selected.value);
    const isRemove = action.classList.contains("mc-inline__action--remove");
    const nextCount = Math.max(2, Math.min(6, currentCount + (isRemove ? -1 : 1)));
    const nextState = editor.querySelector(`.mc-inline__state[value="${nextCount}"]`);
    if (nextState) nextState.checked = true;
  });
});
