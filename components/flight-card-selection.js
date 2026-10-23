document.addEventListener("click", (event) => {
  if (!(event.target instanceof Element)) return;

  const selectedCard = event.target.closest(
    ".flight-results-page .flight-cards > .flight-card",
  );
  if (!selectedCard) return;

  document
    .querySelectorAll(".flight-results-page .flight-cards > .flight-card")
    .forEach((card) => {
      card.classList.toggle("is-result-card-selected", card === selectedCard);
    });
});
