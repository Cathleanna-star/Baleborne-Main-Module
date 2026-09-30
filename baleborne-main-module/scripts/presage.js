const MODULE_ID = "baleborne-main-module";

Hooks.on("renderActorSheet", async (app, html) => {
    const actor = app.actor ?? app.document;

    // Only add Presage to player characters
    if (!actor || actor.type !== "character") return;

    const root = html instanceof HTMLElement ? html : html?.[0];
    if (!root) return;

    // Find PF2e's Biography tab
    const biographyTab = root.querySelector(
        'section.tab.biography[data-tab="biography"]'
    );

    if (!biographyTab) return;

    // Prevent duplicates
    if (biographyTab.querySelector(".baleborne-presage")) return;

    // Get this character's saved Presage
    const rawPresage =
        actor.getFlag(MODULE_ID, "presage") ?? "";

    // Create enriched HTML for the non-editing display
    const enrichedPresage =
        await foundry.applications.ux.TextEditor.enrichHTML(
            rawPresage,
            {
                relativeTo: actor,
                rollData: actor.getRollData?.()
            }
        );

    // Render the Presage wrapper
    const renderedPresage =
        await foundry.applications.handlebars.renderTemplate(
            `modules/${MODULE_ID}/templates/presage.hbs`,
            {}
        );

    // Find Campaign Notes
    const campaignSection =
        biographyTab.querySelector("section.campaign");

    if (!campaignSection) return;

    // Find Notes
    const notesSection =
        campaignSection.querySelector(".bio.campaign-notes");

    if (!notesSection) return;

    // Put Presage directly after Notes
    notesSection.insertAdjacentHTML(
        "afterend",
        renderedPresage
    );

    // Find where the editor belongs
    const editorContainer =
        biographyTab.querySelector(
            ".baleborne-presage-editor"
        );

    if (!editorContainer) return;

    // Create Foundry's native ProseMirror element
    const ProseMirrorElement =
        foundry.applications.elements.HTMLProseMirrorElement;

    const editor =
        ProseMirrorElement.create({
            name: `flags.${MODULE_ID}.presage`,
            value: rawPresage,
            enriched: enrichedPresage,
            toggled: true,
            collaborate: false,
            documentUUID: actor.uuid,
            disabled: !app.isEditable
        });

    // Put the native editor into Presage
    editorContainer.replaceChildren(editor);

    // Save changes to the character
    editor.addEventListener("change", async () => {
        await actor.setFlag(
            MODULE_ID,
            "presage",
            editor.value ?? ""
        );
    });
});