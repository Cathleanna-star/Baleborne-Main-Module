
/* Baleborne Default Language Rarities */


const BALEBORNE_LANGUAGE_MODULE_ID =
	"baleborne-main-module";


const BALEBORNE_LANGUAGE_RARITIES = {

	haka: "rare",
	miumi: "rare",
	morumi: "common",
	atami: "common",
	ahiku: "common",
	katku: "common",
	ueku: "common",
	aeiyo: "uncommon",
	oniyo: "common",
	"kuto-koto": "secret",
	kokoame: "common",
	tamame: "rare",
	inadan: "rare",
	"yatash":"rare"

};

Hooks.once(
	"init",
	() => {

		game.settings.register(
			BALEBORNE_LANGUAGE_MODULE_ID,
			"languageRarityDefaultsAppliedV2",
			{
				scope: "world",
				config: false,
				type: Object,
				default: {}
			}
		);
	}
);



Hooks.once(
	"ready",
	async () => {

		if (!game.user.isGM) {
			return;
		}


		const raritySettings =
			game.settings.get(
				"pf2e",
				"homebrew.languageRarities"
			);


		if (!raritySettings) {
			return;
		}


		const source =
			raritySettings.toObject(
				true
			);


		const appliedDefaults =
			game.settings.get(
				BALEBORNE_LANGUAGE_MODULE_ID,
				"languageRarityDefaultsAppliedV2"
			) ?? {};


		const storedRarityGroups = [
			"uncommon",
			"rare",
			"secret",
			"unavailable"
		];


		let raritiesChanged =
			false;

		let defaultsChanged =
			false;


		for (
			const [
				language,
				defaultRarity
			]
			of Object.entries(
				BALEBORNE_LANGUAGE_RARITIES
			)
		) {


			if (
				appliedDefaults[
					language
				]
			) {
				continue;
			}


			if (
				defaultRarity !== "common" &&
				!storedRarityGroups.includes(
					defaultRarity
				)
			) {

				console.warn(
					`Baleborne Main Module | Invalid default language rarity "${defaultRarity}" for "${language}".`
				);

				continue;
			}

			for (
				const rarity
				of storedRarityGroups
			) {

				source[
					rarity
				] =
					Array.from(
						source[
							rarity
						] ?? []
					).filter(
						slug =>
							slug !==
								language
					);
			}


			if (
				defaultRarity !==
					"common"
			) {

				source[
					defaultRarity
				].push(
					language
				);


				source[
					defaultRarity
				].sort();
			}


			raritiesChanged =
				true;

			appliedDefaults[
				language
			] = true;


			defaultsChanged =
				true;
		}

		if (raritiesChanged) {

			await game.settings.set(
				"pf2e",
				"homebrew.languageRarities",
				source
			);
		}


		if (defaultsChanged) {

			await game.settings.set(
				BALEBORNE_LANGUAGE_MODULE_ID,
				"languageRarityDefaultsAppliedV2",
				appliedDefaults
			);
		}


		if (
			raritiesChanged ||
			defaultsChanged
		) {

			console.log(
				"Baleborne Main Module | Default language rarities applied."
			);
		}
	}
);