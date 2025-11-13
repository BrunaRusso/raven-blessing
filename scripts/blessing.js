Hooks.once('init', () => {
  console.log("🪶 Benção dos Corvos | Módulo inicializado");
});

Hooks.on("renderSceneControls", (controls, b, c) => {
  if (
    game.user.isGM &&
    !document.querySelector(
      "#scene-controls-layers button[data-control='blessing']"
    )
  ) {
    document.querySelector("#scene-controls-layers").insertAdjacentHTML(
      "beforeend",
      `<li>
          <button type="button" class="control ui-control layer icon  fa-solid fa-feather-pointed" role="tab" data-action="blessing" data-control="blessing" data-tooltip="Benção dos Corvos" aria-controls="scene-controls-tools"></button>
      </li>`
    );
    document
      .querySelector("#scene-controls-layers button[data-control='blessing']")
      .addEventListener("click", (e) => {
        console.log("ACHOOOU");
      });
  }
});