/* Counts the vows and makes sure to keep them up to date
   so they can be added up for HP later */

function getVowCount(actor) {

    return actor?.itemTypes?.feat?.filter(
        feat =>
            feat.system
                ?.traits
                ?.value
                ?.includes("vow")
    ).length ?? 0;
}


async function syncVowCount(actor) {

    if (
        !actor ||
        actor.type !== "character" ||
        !actor.isOwner
    ) {
        return;
    }


    const vowCount =
        getVowCount(actor);


    const currentVowCount =
        Number(
            actor.getFlag(
                "world",
                "baleborneVowCount"
            ) ?? 0
        );


    if (
        currentVowCount === vowCount
    ) {
        return;
    }


    await actor.setFlag(
        "world",
        "baleborneVowCount",
        vowCount
    );
}


Hooks.once(
    "ready",
    async () => {

        for (
            const actor
            of game.actors
        ) {

            await syncVowCount(
                actor
            );
        }
    }
);


Hooks.on(
    "createItem",
    async item => {

        const actor =
            item.actor ??
            item.parent;


        if (
            item.type !== "feat"
        ) {
            return;
        }


        await syncVowCount(
            actor
        );
    }
);


Hooks.on(
    "deleteItem",
    async item => {

        const actor =
            item.actor ??
            item.parent;


        if (
            item.type !== "feat"
        ) {
            return;
        }


        await syncVowCount(
            actor
        );
    }
);


Hooks.on(
    "updateItem",
    async item => {

        const actor =
            item.actor ??
            item.parent;


        if (
            item.type !== "feat"
        ) {
            return;
        }


        await syncVowCount(
            actor
        );
    }
);