/*
New designed Pokemon damageCalc
*/

"use strict";

// Set the initial value of drop down lists
$("#parameters select[name='effect']").val("1x");
$("#pkmn select[name='statModifier']").val("0");

// If you need to set a checkbox, use this:
// $(SELECTOR).attr("checked", true);

var DAMAGECALC = (function () {
	//
	// Main object 
	//
	var pokemonBattle = (function () {
		var stats = {},
			results = {};
		
		var setPokemonStats = function () {
			// Get the parameters from the UI
			stats.level = $("#offensive input[name='level']").val();
			stats.atk = $("#offensive input[name='atk']").val();
			stats.atkStatModifier = $("#offensive .statModifier select").val();
			stats.def = $("#defensive input[name='def']").val();
			stats.defStatModifier = $("#defensive .statModifier select").val();
			stats.hp = $("#defensive input[name='hp']").val();
			stats.basePower = $("#parameters input[name='basePower']").val();
			stats.stab = $("#parameters input:checkbox:checked").val();
			// Mod1
			stats.isBurn = $("#parameters input[name='isBurn']").val();
			stats.isReflectLightScreenActive = $("#parameters input[name='isReflectLightScreenActive']").val();
			stats.isDoubleBattle = $("#parameters input[name='isDoubleBattle']").val();
			stats.isSunnyDayRainDanceActive = $("#parameters input[name='isSunnyDayRainDanceActive']").val();
			stats.isFlashFireActive = $("#parameters input[name='isFlashFireActive']").val();
			// Mod2
			stats.equipLifeOrb = $("#parameters input[name='equipLifeOrb']").val();
			// Mod3
			stats.hasSolidRockFilter = $("#parameters input[name='hasSolidRockFilter']").val();
			stats.equipExpertBelt = $("#parameters input[name='equipExpertBelt']").val();
			stats.hasTintedLens = $("#parameters input[name='hasTintedLens']").val();
			stats.isResistBerryActive = $("#parameters input[name='isResistBerryActive']").val();
			stats.isCriticalHit = $("#parameters input[name='isCriticalHit']").val();
			stats.effect = $("#parameters select[name='effect']").val();
		};
	
		var getResults = function () {
			return results;
		};
	
		var updateStats = function () {
			// This function can't be used before setPokemonStats() is called at least once
		
			// Converts parameters into numbers so we can update the stats
			// before passing them to a new pokemonBattle object
			stats.atkStatModifier = battleModifier.parseStatModifier(stats.atkStatModifier);
			stats.defStatModifier = battleModifier.parseStatModifier(stats.defStatModifier);
		
			stats.stab = battleModifier.parseStab(stats.stab);
			stats.effect = battleModifier.parseEffectiveness(stats.effect);

			// Updates the Attack and Defense stats with the modifiers
			stats.atk = stats.atk * stats.atkStatModifier;
			stats.def = stats.def * stats.defStatModifier;
		
			// Other battleModifier methods should be used HERE
			// aka: this is where the brute stats from the UI
			// are transformed to a calc-friendly format
		};
	
		// Calculates the damage usign calculatorModel's methods
		// and assigns it to the results private variable.
		var calcResults = function () {
			setPokemonStats();
			updateStats();
		
			results.minDamage = calculatorModel.calcDamage(stats, "min");
			results.maxDamage = calculatorModel.calcDamage(stats, "max");
		
			// Calculation of the damage percentages
			results.minDamagePercentage = calculatorModel.damagePercentage(stats.hp, results.minDamage);
			results.maxDamagePercentage = calculatorModel.damagePercentage(stats.hp, results.maxDamage);
		};
	
		return {
			getResults: getResults,
			calcResults: calcResults
		};
	})(); // pokemonBattle

	//
	// All the bizarre calculations are done by this guy.
	//
	var calculatorModel = (function () {
		//
		// Receives a stats object with the necessary data and a string
		// specifying if it's max or min damage. Returns max damage by default
		// if the string passed isn't "max" or "min" (case ignored).
		//
		// To do: Implement a way to calculate the probability that a move
		// will OHKO (or 2HKO, 3HKO, etc) a certain pokemon.
		//
		var calcDamage = function (stats, isMaxOrMin) {
			var damage = 0;
		
			if (typeof isMaxOrMin !== "string") {
				console.log("ERROR: isMaxOrMin (in calculatorModel.calcDamage) must be a string!");
				return 0;
			}
			else {
				// Should I use "max", "Max" or "MaX"?!
				// No need to worry!
				isMaxOrMin.toLowerCase();
			
				if (isMaxOrMin === "min") {
					isMaxOrMin = parseFloat(0.85);
				}
				else {
					isMaxOrMin = parseFloat(1);
				}
			}	
		
			// The damage calculation is done here. The damage formula is:
			// 
			// Damage Formula = (((((((Level × 2 ÷ 5) + 2) × BasePower × [Sp]Atk ÷ 50) ÷ [Sp]Def) × Mod1) + 2) × 
			//                 CH × Mod2 × R ÷ 100) × STAB × Type1 × Type2 × Mod3)
		
			// After each "step" in the damage formula, we need to round down the result.
			damage = Math.floor( ( stats.level * 2 ) / 5 );
			damage = Math.floor( ( damage * stats.basePower * stats.atk ) / 50 );
			damage = Math.floor( damage / stats.def );
			//damage = Math.floor( ( damage * stats.mod1 + 2 ) * stats.criticalHit * mod2 );
			//damage = Math.floor( ( damage + 2 ) * stats.criticalHit );
			damage = Math.floor( ( damage + 2 ) );
			damage = Math.floor( damage * isMaxOrMin );
			//damage = Math.floor( damage * stats.stab * effect * mod3 );
			damage = Math.floor( damage * stats.stab * stats.effect );
		
			return damage;
		};
	
		var damagePercentage = function (hp, damage) {
			return ((damage / hp)*10*10).toFixed(2);
		};
	
		return {
			calcDamage: calcDamage,
			damagePercentage: damagePercentage
		};
	})(); // calculatorModel

	//
	// The output showed in the UI is created here.
	//
	var interfaceView = (function () {
	
		var showResultsOnUi = function () {
			var damageTable,
				results;
		
			results = pokemonBattle.getResults();
		
			// Must clean the previous calculation's output
			// Is it better to print everything? Maybe include a "clearscreen" button?
			$("#damage").empty();

			// Hide the div to avoid excessive repaints.
			$("#damage").hide();

			damageTable = "<h1>Damage results</h1>";
			damageTable += "<div class='damageTable'>";
			damageTable += "<h2>Level 100</h2>";

			damageTable += results.minDamagePercentage + "% - " + results.maxDamagePercentage + "% (";

			damageTable += results.minDamage + " - " + results.maxDamage + ")";

			damageTable += "</div>";

			$("#damage").append(damageTable).show();
		};
	
		return {
			showResultsOnUi : showResultsOnUi
		};
	})(); // interfaceView

	//
	// Everything about modifiers is found here!
	//
	var battleModifier = (function () {
		var parseStab = function (stab) {
			var stabMultiplier;
		
			// No problem if you call me twice!
			if (typeof stab === "number") {
				stabMultiplier = stab;
			}
		
			if (stab === 'on') {
				stabMultiplier = 1.5;
			}
			else {
				stabMultiplier = 1;
			}

			return parseFloat(stabMultiplier);
		};
	
		var parseEffectiveness = function (effect) {
			var effectiveness;
		
			// No problem if you call me twice!
			if (typeof effect === "number") {
				effectiveness = effect;
			}

			if (effect === '4x') { effectiveness = 4; }
			else if (effect === '2x') { effectiveness = 2; }
			else if (effect === '1x') { effectiveness = 1; }
			else if (effect === '0.5x') { effectiveness = 0.5; }
			else if (effect === '0.25x') { effectiveness = 0.25; }

			return parseFloat(effectiveness);
		};
	
		var parseStatModifier = function (statModifier) {
			var statModifierValue;
		
			// This function can't be easily protected with the typeof trick
			// used in the above functions. So, consider searching for a
			// double call to this function when debugging some bizarre
			// damage outputs.

			if (statModifier === '0') { statModifierValue = 1; }
			else if (statModifier === '1') { statModifierValue = 1.5; }
			else if (statModifier === '2') { statModifierValue = 2; }
			else if (statModifier === '-1') { statModifierValue = 0.6667; }
			else if (statModifier === '-2') { statModifierValue = 0.5; }
			else if (statModifier === '3') { statModifierValue = 2.5; }
			else if (statModifier === '4') { statModifierValue = 3; }
			else if (statModifier === '5') { statModifierValue = 3.5; }
			else if (statModifier === '6') { statModifierValue = 4; }
			else if (statModifier === '-3') { statModifierValue = 0.4; }
			else if (statModifier === '-4') { statModifierValue = 0.3333; }
			else if (statModifier === '-5') { statModifierValue = 0.2857; }
			else if (statModifier === '-6') { statModifierValue = 0.25; }

			return parseFloat(statModifierValue);
		};
	
		var setMod1 = function (stats) {
			var mod1 = 1;
		
			// Mod1 = BRN × RL × TVT × SR × FF
			// Must parse the stats received from the UI
		
			mod1 = Math.floor( isBurn * isReflectLightScreenActive );
			mod1 = Math.floor( mod1 * isDouble );
			mod1 = Math.floor( mod1 * hasSolidRockFilter );
			mod1 = Math.floor( mod1 * isFlashFireActive );
		
			return mod1;
		};
	
		var setMod2 = function (stats) {
			// This modifier concerns about Me First, Life Orb and Metronome
			// I wont support Me First and Metronome for now, so its basically
			// a Life Orb implementation.
		
			var mod2 = 1;
		
			if (stats.equipLifeOrb === "on") {
				mod2 = parseFloat(1.3);
			}
		
			return mod2;
		};
	
		var setMod3 = function () {
		
		};
	
		return {
			parseStab : parseStab,
			parseEffectiveness : parseEffectiveness,
			parseStatModifier : parseStatModifier
		};
	})(); // battleModifiers

	//
	// This object encapsulates all the validation steps needed for a real battle calculation.
	//
	var validator = (function () {
		// Helper functions
		var validateAttribute = function (attribute, attributeName) {
			if (attribute < 1 || attribute === null) {
				console.log("You entered an invalid value for " + attributeName);
				return false;
			}

			return Math.floor(attribute);
		};
	
		var validateLevel = function (level) {
			if (level < 1 || level === null || level > 100) {
				console.log("You entered an invalid level value.");
				return false;
			}

			return Math.floor(level);
		};
	
		var validateStats = function (stats) {
			stats.atk = validateAttribute(atk, "Attack");
			stats.def = validateAttribute(def, "Defense");
			stats.hp = validateAttribute(hp, "HP");
			stats.basePower = validateAttribute(basePower, "Base Power");
		
			return stats;
		};
	
		return validateStats;
	})(); // validator
	
	// DAMAGECALC's public interface
	return {
		pokemonBattle : pokemonBattle,
		calculatorModel : calculatorModel,
		interfaceView : interfaceView,
		battleModifier : battleModifier,
		validator : validator
	};
})(); // DAMAGECALC

	// Assign a method to a button click event at the UI
	$("#calcButton button").click(function () {
		// Updates the internal representation of the battle
		DAMAGECALC.pokemonBattle.calcResults();
		// Prints the results on the UI
		DAMAGECALC.interfaceView.showResultsOnUi();
	});