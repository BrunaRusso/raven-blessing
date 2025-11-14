const players = ["AbdmFYnE1ZfikJn4", "NT173HaeDSgPtWow", "8uujKB3FMYN9eoQ5"];
const SCOPE = 'bencao-dos-corvos';
const KEY = 'acumulados';

Hooks.once('initializeCanvasEnvironment', async () => {
    console.log("🐦‍⬛ Benção dos Corvos | Módulo inicializado");
});

async function updateFlag(actor, value = 0) {
    const upd = {};
    upd[`flags.${SCOPE}.${KEY}`] = value;

    await actor.update(upd);
}

if (!window.__bencao_hook_registered_v13) {
    window.__bencao_hook_registered_v13 = true;

    // Atualiza a posição da label enquanto o token é movido
    Hooks.on("updateToken", (scene, tokenData, updates, options, userId) => {
        const token = canvas.tokens.get(tokenData._id);
        if (token?.labelBlessing)
            updateLabelPosition(token);
    });

    // Também durante movimento ativo no cliente (real-time drag)
    Hooks.on("refreshToken", (token) => {
        if (token?.labelBlessing)
            updateLabelPosition(token);
    });

    Hooks.on("preDeleteToken", async (tokenDocument, options, userId) => {
        const token = await canvas.tokens.get(tokenDocument._id);

        if (token?.labelBlessing)
            destroyLabel(token);
    });

    Hooks.on("createToken", async (tokenDocument, options, userId) => {
        const actor = await game.actors.get(tokenDocument.actorId);
        const token = await canvas.tokens.get(tokenDocument._id);

        if (actor.flags?.[SCOPE]) {
            if (actor.flags?.[SCOPE]?.[KEY] > 0)
                createOrUpdateLabel(token, actor.flags?.[SCOPE]?.[KEY]);
        }
    });
}


Hooks.on("renderSceneControls", (controls, b, c) => {
    if (!document.querySelector("#scene-controls-layers button[data-control='blessing']")) {
        document.querySelector("#scene-controls-layers").insertAdjacentHTML(
            "beforeend",
            `<li>
                <button type="button" class="control ui-control layer icon  fa-solid fa-feather-pointed" role="tab" data-action="blessing" data-control="blessing" data-tooltip="Benção dos Corvos" aria-controls="blessing"></button>
            </li>`
        );

        document
            .querySelector("#scene-controls-layers button[data-control='blessing']")
            .addEventListener("click", async (e) => {
                const myDialog = new foundry.applications.api.DialogV2({
                    window: { title: "Benção dos Corvos" },
                    content: "Selecione um token e a opção a seguir:",
                    buttons: [
                        {
                            action: "addBlessing",
                            label: "Adicionar",
                            icon: "fa-solid fa-plus",
                            callback: async (event, button, dialog) => {
                                await addBlessing();
                            }
                        },
                        {
                            action: "removeBlessing",
                            label: "Remover",
                            icon: "fa-solid fa-minus",
                            callback: async (event, button, dialog) => {
                                await removeBlessing();
                            }
                        },
                        {
                            action: "resetBlessing",
                            icon: "fa-solid fa-arrow-rotate-left",
                            label: "Resetar",
                            callback: async (event, button, dialog) => {
                                await resetBlessing();
                            }
                        }
                    ],
                    form: {
                        closeOnSubmit: false
                    }
                });

                myDialog.render(true);
            });

    }
});

async function addBlessing() {
    if (!canvas || !canvas.tokens) {
        ui.notifications.error("Canvas não está pronto.");
        return;
    }

    if (canvas.tokens.controlled.length !== 1) {
        ui.notifications.warn("Selecione 1 token para abençoar.");
        return;
    }

    const actorId = canvas.tokens.controlled[0].actor._id;
    const token = canvas.tokens.controlled[0];

    if (!players.includes(actorId)) {
        ui.notifications.warn("O personagem abençoado deve ser um player.");
        return;
    }

    const actor = await game.actors.get(actorId);
    var flag;

    if (actor.flags?.[SCOPE]) {
        var value = actor.flags?.[SCOPE]?.[KEY] + 1;
        updateFlag(actor, value);
        createOrUpdateLabel(token, value);
    }
    else {
        await updateFlag(actor, 1);
    }
}

async function removeBlessing() {
    if (!canvas || !canvas.tokens) {
        ui.notifications.error("Canvas não está pronto.");
        return;
    }

    if (canvas.tokens.controlled.length !== 1) {
        ui.notifications.warn("Selecione 1 token para abençoar.");
        return;
    }

    const actorId = canvas.tokens.controlled[0].actor._id;
    const token = canvas.tokens.controlled[0];

    if (!players.includes(actorId)) {
        ui.notifications.warn("O personagem abençoado deve ser um player.");
        return;
    }

    const actor = await game.actors.get(actorId);
    var flag;

    if (actor.flags?.[SCOPE]) {
        var value = actor.flags?.[SCOPE]?.[KEY];
        console.log(value);

        if (value <= 0) {
            await updateFlag(actor, 0);
            destroyLabel(token);
        }
        else {
            value = value - 1;
            await updateFlag(actor, value);
            createOrUpdateLabel(token, value)
        }
    }
    else {
        ui.notifications.warn("O player já não possui bençãos.");
    }
}

async function resetBlessing() {
    if (!canvas || !canvas.tokens) {
        ui.notifications.error("Canvas não está pronto.");
        return;
    }

    if (canvas.tokens.controlled.length !== 1) {
        ui.notifications.warn("Selecione 1 token para abençoar.");
        return;
    }

    const actorId = canvas.tokens.controlled[0].actor._id;
    const token = canvas.tokens.controlled[0];

    if (!players.includes(actorId)) {
        ui.notifications.warn("O personagem abençoado deve ser um player.");
        return;
    }

    const actor = await game.actors.get(actorId);

    await updateFlag(actor, 0);
    destroyLabel(token);
}

Hooks.on("canvasReady", (canvas) => {
    players.forEach(async (id) => {
        var actor = await game.actors.get(id);
        var flag;

        if (actor.flags?.[SCOPE]) {
            var token = await actor.getActiveTokens().at(0);

            if (token) {
                var value = actor.flags?.[SCOPE]?.[KEY]

                if (value <= 0) {
                    destroyLabel(token);
                } else {
                    createOrUpdateLabel(token, value);
                }
            }

        }
        else {
            console.log(`${actor.name} não possui a benção`);
            await updateFlag(actor);
        }

    });
});

function updateLabelPosition(token, label = token.labelBlessing) {
    if (!label || label.destroyed) return;
    const center = token.center;
    // posicione um pouco acima do token
    label.position.set(center.x, center.y - token.h / 2 - 8);
}

function createOrUpdateLabel(token, value) {
    if (!token) {
        return;
    }
    // Se já existe, só atualiza
    if (token.labelBlessing && !token.labelBlessing.destroyed) {
        token.labelBlessing.text = `🐦‍⬛ ${value}`;
        token.labelBlessing.visible = true;
        updateLabelPosition(token);
        return token.labelBlessing;
    }

    const style = new PIXI.TextStyle({
        fontFamily: "Arial",
        fontSize: 26,
        fontWeight: "700",
        fill: ["#000000"],
        stroke: "#FFF",
        strokeThickness: 4,
        align: "center",
        dropShadow: true,
        dropShadowAlpha: 100,
        dropShadowAngle: 1,
        dropShadowBlur: 5,
        dropShadowColor: "#ffffff",
        dropShadowDistance: 1,
    });

    const text = new PIXI.Text(`🐦‍⬛ ${value}`, style);
    text.anchor.set(0.5, 1);
    updateLabelPosition(token, text);
    text.zIndex = 5000;

    // clique para resetar (opcional)
    text.interactive = true;
    text.buttonMode = true;

    // Adiciona ao container de tokens para acompanhar a camada
    canvas.tokens.addChild(text);
    token.labelBlessing = text;
    return text;
}

function destroyLabel(token) {
    if (token) {
        if (token.labelBlessing && !token.labelBlessing.destroyed) {
            token.labelBlessing.destroy();
            token.labelBlessing = null;
        }
    }
}