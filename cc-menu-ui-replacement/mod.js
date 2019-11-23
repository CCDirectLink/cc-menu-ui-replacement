ig.module("game.feature.menu.gui.menu-gui-injection").requires(
	"game.feature.menu.gui.item.item-status-default",
	"game.feature.menu.gui.map.map-misc",
	"game.feature.menu.gui.map.map-worldmap",
	"game.feature.menu.gui.main-menu",
	"game.feature.menu.gui.status.status-view-main",
	"game.feature.model.base-model",
	"game.main",
	"impact.base.loader"
).defines(function() {
	// This file is a rather verbose way to replace Lea with alternative characters in all the menu/map GUI displays when needed
	// A more modular system of GUI replacement, in case someone else is crazy enough to replace menu GUI with their OC.

	// Default character is none other than everyone's favorite blueberry
	var currentChar = "Lea";
	// Maps supported character names to a GUI config
	const charConfigs = {};
	// Stores image offset data for the menu to extract UI elements from the custom spritesheet with
	sc.CharMenuGUIConfig = ig.JsonLoadable.extend({
		cacheType: "Menu",
		Large: null,
		Small: null,
		Head: null,
		AreaButton: null,
		MapFloorButtonContainer: null,
		Label: null,
		init: function(a) {
            this.parent(a);
            this.Label = a;
        },
	    getJsonPath: function() {
	        return ig.root + this.path.toPath("data/menu/", ".json") + ig.getCacheSuffix()
	    },
	    onload: function(a) {
	    	if (a.DOCTYPE == "MENU_GUI_CONFIG") {
		    	this.Large = a.Large;
		    	this.Small = a.Small;
		    	this.Head = a.Head;
		    	this.AreaButton = a.AreaButton;
		    	this.MapFloorButtonContainer = a.MapFloorButtonContainer;
		    	charConfigs[a.ModelName] = this;
	    	}
	    },
	    onCacheCleared: function() {}
	});
	// This is where you connect your custom character data to this mod!
	// For each custom character to inject:
	// - Add GUI injection metadata to assets/data/menu/[character name].json
	// - Add GUI injection spritesheet to assets/media/gui/menu-[character name].png
	// The character name should match the name used for the custom character's other data files
	// (ex. 'glasses' for C'Tron).
	// If the current character model has a name not recognized by the custom menu, the UI defaults to Lea.

	// Take a look at assets/data/menu/emilie.json for an example of how a menu GUI config file should look like.
	// Those offsets correspond to GUI elements found in assets/media/gui/menu-emilie.png
	const supportedChars = ["emilie"];
	supportedChars.forEach(function (char) { new sc.CharMenuGUIConfig(char) });

	// Copy of the base Lea UI element, for keeping Lea in the UI while we modify sc.MainMenu.Lea
	sc.MainMenu.BaseLea = sc.MainMenu.Lea.extend({});

	// UI element for large full-body portrait (main menu)
	sc.MainMenu.CustomLarge = ig.GuiElementBase.extend({
	    gfx: new ig.Image("media/gui/menu.png"),
	    skinGfx: null,
	    transitions: {
	        DEFAULT: {
	            state: {},
	            time: 0.2,
	            timeFunction: KEY_SPLINES.EASE
	        },
	        FADE_TO_SMALL: {
	            state: {
	                scaleX: 0.69,
	                scaleY: 0.69,
	                alpha: 1
	            },
	            time: 0.2,
	            timeFunction: KEY_SPLINES.EASE
	        },
	        FADE_IN_ALPHA: {
	            state: {
	                scaleX: 0.69,
	                scaleY: 0.69,
	                alpha: 0
	            },
	            time: 0.2,
	            timeFunction: KEY_SPLINES.EASE
	        },
	        HIDDEN: {
	            state: {
	                alpha: 0
	            },
	            time: 0.2,
	            timeFunction: KEY_SPLINES.LINEAR
	        }
	    },
	    init: function() {
	        this.parent();
	        this.hook.size.x =
	            140;
	        this.hook.size.y = 398;
	        this.hook.pivot.x = this.hook.size.x / 2;
	        this.hook.pivot.y = this.hook.size.y / 2;
	        this.doStateTransition("DEFAULT")
	    },
	    updateDrawables: function(a) {
	    	const { gfxOffX, gfxOffY, offX, offY, sizeX, sizeY } = charConfigs[currentChar].Large;
	        a.addDraw().setGfx(this.gfx, gfxOffX, gfxOffY, offX, offY, sizeX, sizeY)
	    }
	});

	// UI element for small full-body portrait (equipment screen)
	sc.MainMenu.CustomSmall = ig.GuiElementBase.extend({
	    gfx: new ig.Image("media/gui/menu.png"),
	    skinGfx: null,
	    transitions: {
	        DEFAULT: {
	            state: {},
	            time: 0.2,
	            timeFunction: KEY_SPLINES.LINEAR
	        },
	        HIDDEN: {
	            state: {
	                alpha: 0
	            },
	            time: 0.2,
	            timeFunction: KEY_SPLINES.LINEAR
	        }
	    },
	    init: function() {
	        this.parent();
	        this.hook.size.x = 94;
	        this.hook.size.y = 270;
	        this.hook.pivot.x = this.hook.size.x / 2;
	        this.hook.pivot.y = this.hook.size.y / 2;
	        this.doStateTransition("DEFAULT")
	    },
	    updateDrawables: function(a) {
	    	const { gfxOffX, gfxOffY, offX, offY, sizeX, sizeY } = charConfigs[currentChar].Small;
	        a.addGfx(this.gfx, gfxOffX, gfxOffY, offX, offY, sizeX, sizeY)
	    }
	});

	// Custom version of the main menu with the modified full-body portraits
	sc.MainMenu.Custom = ig.GuiElementBase.extend({
	    transitions: {
	        DEFAULT: {
	            state: {},
	            time: 0.2,
	            timeFunction: KEY_SPLINES.EASE
	        },
	        HIDDEN: {
	            state: {
	                alpha: 0,
	                offsetY: 20
	            },
	            time: 0.2,
	            timeFunction: KEY_SPLINES.LINEAR
	        },
	        HIDDEN_NO_OFFSET: {
	            state: {
	                alpha: 0
	            },
	            time: 0.2,
	            timeFunction: KEY_SPLINES.LINEAR
	        }
	    },
	    large: null,
	    small: null,
	    init: function() {
	        this.parent();
	        this.hook.size.x = charConfigs[currentChar].Large.sizeX;
	        this.hook.size.y = charConfigs[currentChar].Large.sizeY;
	        this.large = new sc.MainMenu.CustomLarge;
	        this.large.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
	        this.small = new sc.MainMenu.CustomSmall;
	        this.small.setAlign(ig.GUI_ALIGN.X_CENTER, ig.GUI_ALIGN.Y_CENTER);
	        this.small.setPos(1, 0);
	        this.addChildGui(this.large);
	        this.addChildGui(this.small);
	        this.doStateTransition("HIDDEN", true);
	        this.reset();
	        sc.Model.addObserver(sc.model.menu, this);
	        sc.Model.addObserver(sc.playerSkins, this)
	    },
	    moveLea: function(a, b, e, f) {
	        if (this.hook.currentStateName == "HIDDEN" || this.hook.currentStateName ==
	            "HIDDEN_NO_OFFSET") {
	            f && this.hook.doStateTransition("HIDDEN_NO_OFFSET", true);
	            this.hook.doStateTransition("DEFAULT")
	        }
	        f ? this.setPos(a, 101 + b) : this.doPosTranstition(0 + a, 101 + b, f ? 0 : 0.3, KEY_SPLINES
	            .EASE);
	        if (e && !this.isSmall())
	            if (f) {
	                this.large.doStateTransition("FADE_IN_ALPHA", true);
	                this.small.doStateTransition("DEFAULT", true)
	            } else this.fadeToSmall();
	        else !e && this.isSmall() && this.fadeToLarge()
	    },
	    hideLea: function() {
	        this.isSmall() ? this.doStateTransition("HIDDEN_NO_OFFSET", false, false, function() {
	            this.reset();
	            this.doStateTransition("HIDDEN", true)
	        }.bind(this)) : this.doStateTransition("HIDDEN", false, false, function() {
	            this.reset()
	        }.bind(this))
	    },
	    reset: function() {
	        this.large.doStateTransition("DEFAULT", true);
	        this.small.doStateTransition("HIDDEN", true);
	        this.setPos(0, 101)
	    },
	    fadeToSmall: function() {
	        this.large.doStateTransition("FADE_TO_SMALL", false, false, function() {
	            this.large.doStateTransition("FADE_IN_ALPHA")
	        }.bind(this));
	        this.small.doStateTransition("DEFAULT", false, false, null, 0.2)
	    },
	    fadeToLarge: function() {
	        this.small.doStateTransition("HIDDEN");
	        this.large.doStateTransition("FADE_TO_SMALL", false, false, function() {
	            this.large.doStateTransition("DEFAULT")
	        }.bind(this))
	    },
	    isSmall: function() {
	        return this.small.hook.currentStateName == "DEFAULT"
	    },
	    modelChanged: function(a, b, e) {
	        if (a == sc.menu) b == sc.MENU_EVENT.LEA_STATE_CHANGED && (sc.menu.leaState == sc
	            .MENU_LEA_STATE.HIDDEN ? this.hideLea() : this.moveLea(e.x, e.y, sc.menu.leaState, e.skip)
	        );
	        else if (a == sc.playerSkins)
	            if ((a = sc.playerSkins.getCurrentSkin("Appearance")) && a.loaded) {
	                this.small.skinGfx = a.guiImage;
	                this.large.skinGfx = a.guiImage
	            } else {
	                this.small.skinGfx = null;
	                this.large.skinGfx = null
	            }
	    }
	});

	// These indicate where in Shadoon your character is located at
	sc.AreaButton.inject({
    	iconGfx: new ig.Image("media/gui/menu.png")
    });

	// Base Lea version
	const leaAreaButtonDrawable = function(a) {
        this.focus && a.addGfx(this.gfx, -3, -2, 421, 173, 21, 21).setCompositionMode("lighter");
        a.addGfx(this.gfx, 4, 4, 328 + this.icon, 456 + (this.activeArea ? 8 : 0), 8, 8);
        if (this.activeArea) {
            a.addGfx(this.gfx,
                1, 2, 304, 440, 3, 3);
            a.addGfx(this.iconGfx, -11, -8, 280, 424, 16, 11)
        }
    };

    // Custom version
    const customAreaButtonDrawable = function(a) {
        this.focus && a.addGfx(this.gfx, -3, -2, 421, 173, 21, 21).setCompositionMode("lighter");
        a.addGfx(this.gfx, 4, 4, 328 + this.icon, 456 + (this.activeArea ? 8 : 0), 8, 8);
        if (this.activeArea) {
            a.addGfx(this.gfx,
                1, 2, 304, 440, 3, 3);
            const { gfxOffX, gfxOffY, offX, offY, sizeX, sizeY } = charConfigs[currentChar].AreaButton;
            a.addGfx(this.iconGfx, gfxOffX, gfxOffY, offX, offY, sizeX, sizeY);
        }
    };

    // These indicate which floor in an area your character is located at
    sc.MapFloorButtonContainer.inject({
    	init: function() {
			this.parent();
	        this.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				},
				HIDDEN: {
					state: {
						alpha: 0,
						offsetX: -87
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
	        };
	        this.setPos(25, 33);
	        this.setAlign(ig.GUI_ALIGN.X_RIGHT, ig.GUI_ALIGN.Y_TOP);
	        this.doStateTransition("HIDDEN", true);
	        this._submitSound = sc.BUTTON_SOUND.submit;
	        this.buttongroup = new sc.ButtonGroup;
	        this.buttongroup.ignoreActiveFocus = true;
	        this.buttongroup.addPressCallback(this.onFloorPress.bind(this));
    		if (charConfigs[currentChar]) {
	    		const { offX, offY, sizeX, sizeY } = charConfigs[currentChar].MapFloorButtonContainer;
	    		this.leaIcon = new ig.ImageGui(this.gfx, offX, offY, sizeX, sizeY);
    		} else {
    			this.leaIcon = new ig.ImageGui(this.gfx, 280, 388, 34, 20);
    		}
	        this.leaIcon.hook.transitions = {
				DEFAULT: {
					state: {},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				},
				HIDDEN: {
					state: {
						alpha: 0
					},
					time: 0.2,
					timeFunction: KEY_SPLINES.LINEAR
				}
	        };
        	this.leaIcon.doStateTransition("HIDDEN", true);
	        if (sc.map.getCurrentArea()) {
	            this._floors = sc.map.getCurrentArea().floors;
	            this.setSize(62, 34 * this._floors.length + -8 * Math.max(0, this._floors.length - 1));
	            this._createButtons(true)
	        }
    	}
    });

    // Head shot GUI element (seen in character summaries)
    const headUpdateDrawables = function(a) {
        this.parent(a);
        if (charConfigs[currentChar]) {
        	const { gfxOffX, gfxOffY, offX, offY, sizeX, sizeY } = charConfigs[currentChar].Head;
        	a.addGfx(this.menuGfx, gfxOffX, gfxOffY, offX, offY, sizeX, sizeY);
        } else {
        	a.addGfx(this.menuGfx, 0, 0, 280, 472, 126, 35);
        }
        a.addGfx(this.statusGfx, 64, 5, 104, 32 + sc.model.player.currentElementMode * 24, 24, 24)
    };

    sc.ItemStatusDefault.inject({
    	updateDrawables: headUpdateDrawables
    });

    sc.StatusViewMainParameters.inject({
    	updateDrawables: headUpdateDrawables
    });

    var currMenu, currPauseScreen;

    // Some observer (event listener) manipulation magic done at startup so that the custom menu doesn't spawn duplicate quick menu buttons
	sc.CrossCode.inject({
	    init: function() {
	        this.parent();
	        sc.model.menu.observers.forEach((obs, idx) => {
	        	if (obs instanceof sc.MainMenu) {
	        		currMenu = obs;
	        	} else if (obs instanceof sc.PauseScreenGui) {
	        		currPauseScreen = obs;
	        	}
	        })
	    }
	});

	sc.Model.removeObservers = function(b, a) {
		const idxs = a.map(e => b.observers.indexOf(e));
        a.forEach(e => b.observers.erase(e));
        return idxs;
    };

	sc.Model.removeObserver = function(b, a) {
		const idx = b.observers.indexOf(a);
        b.observers.erase(a);
        return idx;
    };

    sc.Model.moveObserverTo = function(b, a, idx) {
        if (!a) throw Error("Existing Observer is null!");
        if (idx < 0 || idx > b.observers.length) throw Error(`Replacement index is invalid! (Got ${idx} when max size is ${b.observers.length})`);
    	if (b.observers.indexOf(a) == -1) throw Error("Observer does not exist in model!");
    	b.observers.erase(a);
        b.observers.splice(idx, 0, a);
    };

	const refreshMenu = function() {
		ig.gui.removeGuiElement(currMenu);
		ig.gui.removeGuiElement(currPauseScreen);
		const oldMenuIdxs = sc.Model.removeObservers(sc.model.menu, [currMenu, currMenu.lea, currMenu.menuDisplay, currPauseScreen]);
		const oldMenuIdx = oldMenuIdxs[0];
		const oldMenuLeaIdx = oldMenuIdxs[1];
		const oldMenuDisplayIdx = oldMenuIdxs[2];
		const oldPauseScreenIdx = oldMenuIdxs[3];
		const oldModelIdx = sc.Model.removeObserver(sc.model, currMenu);
		currMenu.hook.onDetach();
		currPauseScreen.hook.onDetach();
		currMenu = new sc.MainMenu;
		currPauseScreen = new sc.PauseScreenGui;
		ig.gui.addGuiElement(currMenu);
		console.log(oldModelIdx, oldMenuIdx, oldMenuDisplayIdx, oldMenuLeaIdx, oldPauseScreenIdx);
		if (oldModelIdx != -1) {
			sc.Model.moveObserverTo(sc.model, currMenu, oldModelIdx);
		}
		if (oldMenuIdx != -1) {
			sc.Model.moveObserverTo(sc.model.menu, currMenu, oldMenuIdx);
		}
		if (oldMenuDisplayIdx != -1) {
			sc.Model.moveObserverTo(sc.model.menu, currMenu.menuDisplay, oldMenuDisplayIdx);
		}
		if (oldMenuLeaIdx != -1) {
			sc.Model.moveObserverTo(sc.model.menu, currMenu.lea, oldMenuLeaIdx);
		}
		if (oldPauseScreenIdx != -1) {
			sc.Model.moveObserverTo(sc.model.menu, currPauseScreen, oldPauseScreenIdx);
		}
	}

	// Puts all the custom UI elements together!
	const CustomMenuGfx = ig.Class.extend({
		init: function() {
			this.model = sc.model.player;
			sc.Model.addObserver(this.model, this);
		},
		modelChanged: function(object, event) {
			if (object === this.model) {
				if (event === sc.PLAYER_MSG.CONFIG_CHANGED) {
					if (charConfigs[this.model.name]) {
						currentChar = this.model.name;
						sc.MainMenu.Lea = sc.MainMenu.Custom;
						const imgPath = `media/gui/menu-${charConfigs[this.model.name].Label}.png`;
						sc.MainMenu.CustomLarge.inject({
							gfx: new ig.Image(imgPath)
						});
						sc.MainMenu.CustomSmall.inject({
							gfx: new ig.Image(imgPath)
						});
						sc.ItemStatusDefault.inject({
							menuGfx: new ig.Image(imgPath)
						});
						sc.StatusViewMainParameters.inject({
							menuGfx: new ig.Image(imgPath)
						});
						sc.MainMenu.inject({
							gfx: new ig.Image(imgPath)
						});
						sc.AreaButton.inject({
							iconGfx: new ig.Image(imgPath),
							updateDrawables: customAreaButtonDrawable
						});
						sc.MapFloorButtonContainer.inject({
							gfx: new ig.Image(imgPath)
						});
					} else {
						sc.MainMenu.Lea = sc.MainMenu.BaseLea;
						sc.ItemStatusDefault.inject({
							menuGfx: new ig.Image("media/gui/menu.png")
						});
						sc.StatusViewMainParameters.inject({
							menuGfx: new ig.Image("media/gui/menu.png")
						});
						sc.MainMenu.inject({
							gfx: new ig.Image("media/gui/menu.png")
						});
						sc.AreaButton.inject({
							iconGfx: new ig.Image("media/gui/menu.png"),
							updateDrawables: leaAreaButtonDrawable
						});
						sc.MapFloorButtonContainer.inject({
							gfx: new ig.Image("media/gui/menu.png")
						});
					}
					refreshMenu();
				}
			}
		}
	});

	ig.addGameAddon(function() {
		return new CustomMenuGfx();
	});
});