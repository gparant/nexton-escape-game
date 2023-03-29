/// <reference types="@workadventure/iframe-api-typings" />

import { bootstrapExtra } from "@workadventure/scripting-api-extra";
import { CreateUIWebsiteEvent } from "@workadventure/iframe-api-typings/Api/Events/Ui/UIWebsite";

import "./button/GroupMeeting";

console.log('Script started successfully');

let currentPopup: any = undefined;

// Waiting for the API to be ready
WA.onInit().then(() => {
    console.log('Scripting API ready');
    console.log('Player tags: ',WA.player.tags)

    const mapUrl = WA.room.mapURL;
    const root = mapUrl.substring(0, mapUrl.lastIndexOf("/"))

    const information: CreateUIWebsiteEvent = {
        url:  root + "/information.html",
        visible: true,
        allowApi: true,
        allowPolicy: "",   // The list of feature policies allowed
        position: {
            vertical: "top",
            horizontal: "middle",
        },
        size: {            // Size on the UI (available units: px|em|%|cm|in|pc|pt|mm|ex|vw|vh|rem and others values auto|inherit)
            width: "800px",
            height: "200px",
        },
    }

    // ROOM 1
    const clueWarning = "Demander un indice vous coûtera 1 minute 💥";
    const clueCollected = "Vous avez rassemblé tous les indices !";
    const cheatWarning = "Vous devez recommencer. Cela peut être dû à la corruption des données ou vous essayez de tricher 😮";
    let cigaretteFound = false

    WA.room.onEnterLayer("cigarette").subscribe(() => {
        if (WA.state.CigaretteVisible) {
            currentPopup = WA.ui.openPopup("cigarettePopup", "Une cigarette laissée par terre. Il y a une poubelle pour ça, mais cette personne était visiblement pressée 😠", [])
            cigaretteFound = true
            WA.state.CigaretteVisible = false
        }
    })
    WA.room.onLeaveLayer("cigarette").subscribe(closePopup)

    WA.room.area.onEnter("garbageCan").subscribe(() => {
        if (cigaretteFound && !WA.state.CigaretteComplete) {
            currentPopup = WA.ui.openPopup("garbageCanPopup", "Vous pouvez jetez la cigarette à la poubelle pour valider votre première action écologique 🌍. Merci 🫶", [])
            WA.state.CigaretteComplete = true
        }
    })
    WA.room.area.onLeave("garbageCan").subscribe(closePopup)

    WA.room.area.onEnter("info").subscribe(() => {
        currentPopup = WA.ui.openPopup("infoPopup", "Le but est d'entrer tous ensemble dans le train n°1 et de le démarrer afin de s'échapper ! La porte ne peut être ouverte que si vous avez réussi toutes les énigmes. Bonne chance 💪", [])
    })
    WA.room.area.onLeave("info").subscribe(closePopup)

    WA.room.area.onEnter("game").subscribe(() => {
        currentPopup = WA.ui.openPopup("gamePopup", "Le morpion... Pensez-vous pourvoir gagner contre nous ? 😈", []);
        WA.state.TicTacToeStarted = true
    })
    WA.room.area.onLeave("game").subscribe(closePopup)

    WA.room.onEnterLayer("tic-tac-toe").subscribe(() => {
        if (WA.state.TicTacToeStarted) {
            WA.state.TicTacToeOngoing = true
            WA.room.setProperty("tic-tac-toe", "silent", true)

        }
    })
    WA.room.onLeaveLayer("tic-tac-toe").subscribe(() => {
        if (!WA.state.TicTacToeComplete) {
            WA.state.TicTacToeOngoing = false
        }
    })

    WA.room.onEnterLayer("tic-tac-toe-play1").subscribe(() => {
        if (WA.state.TicTacToeStarted) {
            WA.state.TicTacToePlay1 = true
            WA.state.TicTacToeComplete = WA.state.TicTacToePlay2
        }
    })
    WA.room.onLeaveLayer("tic-tac-toe-play1").subscribe(() => {
        if (!WA.state.TicTacToeComplete) {
            WA.state.TicTacToePlay1 = false
        }
    })

    WA.room.onEnterLayer("tic-tac-toe-play2").subscribe(() => {
        if (WA.state.TicTacToeStarted) {
            WA.state.TicTacToePlay2 = true
            WA.state.TicTacToeComplete = WA.state.TicTacToePlay1
        }
    })
    WA.room.onLeaveLayer("tic-tac-toe-play2").subscribe(() => {
        if (!WA.state.TicTacToeComplete) {
            WA.state.TicTacToePlay2 = false
        }
    })

    WA.chat.onChatMessage((message => {
        if (WA.state.QuestionOngoing) {
            WA.state.QuestionComplete = message == "46"
            if (WA.state.QuestionComplete) {
                WA.chat.sendChatMessage("Parfait! Vous pouvez entrer 🚀", "KindRobot000")
                WA.state.TrainDoorOpen = true;
                WA.state.GameState = "room2";
            } else {
                WA.chat.sendChatMessage("Aïe, détective n'est pas votre qualité première... je me trompe ? Malheureusement, vous devez tout reprendre depuis le début 😪", "KindRobot000")
                WA.state.TicTacToeStarted = false
                WA.state.TicTacToeOngoing = false
                WA.state.TicTacToePlay1 = false
                WA.state.TicTacToePlay2 = false
                WA.state.TicTacToeComplete = false
                WA.state.CigaretteVisible = true
                cigaretteFound = false
                WA.state.CigaretteComplete = false
                WA.state.QuestionOngoing = false
                WA.state.QuestionComplete = false
                WA.state.TrainDoorOpen = false
            }
        }
    }));

    WA.room.area.onEnter("room1bot").subscribe(() => {
        if (WA.state.QuestionComplete) return
        if (WA.state.TicTacToeComplete && WA.state.CigaretteComplete) {
            WA.chat.sendChatMessage("Mr Robot : Tapez votre réponse ici, mais réfléchissez bien ! Si vous faites une erreur, vous devrez tout recommencer.", "KindRobot000")
            WA.state.QuestionOngoing = true
        } else {
            const allClueCollected = WA.state.loadVariable(`Room1Clue3`) === true;
            currentPopup = WA.ui.openPopup("room1botPopup", "Mr Robot : Étranger, je bloquerai l'accès à ce train jusqu'à ce que vous prouviez votre valeur. " + (allClueCollected ? clueCollected : clueWarning), allClueCollected ? [] : [
                {
                    label: 'Give me a clue',
                    className: 'primary',
                    callback: () => {
                        giveClue(1);
                        currentPopup.close();

                        const closeButton: ButtonDescriptor = {
                            label: 'Close',
                            className: 'primary',
                            callback: () => closePopup()
                        };
                        const allClueCollected = WA.state.loadVariable(`Room1Clue3`) === true;
                        if(allClueCollected){
                            currentPopup = WA.ui.openPopup("room1botPopup", clueCollected, [
                                closeButton
                            ]);
                        }else{
                            currentPopup = WA.ui.openPopup("room1botPopup", "Mr Robot : Étranger, reviens vers moi si tu veux un autre indice !", [
                                closeButton
                            ]);
                        }
                    }
                }
            ])
        }
    })
    WA.room.area.onLeave("room1bot").subscribe(closePopup)

    WA.room.area.onEnter("goToDriverCabine").subscribe(() => {
        WA.nav.goToRoom("#driver-cabine")
        const x = 137*32
        const y = 16*32
        WA.camera.set(x, y, 500, 500, false, true)
    })

    // ROOM 2
    WA.room.onEnterLayer("driver-cabine").subscribe(() => {
        // anti-cheat
        if (!WA.state.TrainDoorOpen) {
            WA.controls.disablePlayerControls()
            currentPopup = WA.ui.openPopup("driverCabinePopup", cheatWarning, [])
        }
    })

    WA.room.area.onEnter("room2bot").subscribe(() => {
        if (WA.state.TrainStarted) return
        currentPopup = WA.ui.openPopup("room2botPopup", "Étranger, il semble que ce train ne démarrera pas tant que vous n'aurez pas trouvé la bonne clé. " + clueWarning, [
            {
                label: 'Give me a clue',
                className: 'primary',
                callback: () => giveClue(2),
            }
        ])
    })
    WA.room.area.onLeave("room2bot").subscribe(closePopup)

    WA.room.area.onEnter("room2coffee").subscribe(() => {
        currentPopup = WA.ui.openPopup("room2coffeePopup", "Yous avez trouvé une tasse de café. Des études ont montré que la consommation optimale pour des adultes en bonne santé est de 3 tasses de café.", [])
    })
    WA.room.area.onLeave("room2coffee").subscribe(closePopup)

    WA.room.area.onEnter("room2pretzel").subscribe(() => {
        currentPopup = WA.ui.openPopup("room2pretzelPopup", "Vous avez trouvé un bretzel. Vu la taille de ce Bretzel, 1 suffit amplement au petit-déjeuner !", [])
    })
    WA.room.area.onLeave("room2pretzel").subscribe(closePopup)

    WA.room.area.onEnter("room2oldMap").subscribe(() => {
        currentPopup = WA.ui.openPopup("room2oldMapPopup", "Vous avez trouvé une vieille carte. C'est très rare. Il n'en existe que 8 comme celui-ci dans le monde !", [])
    })
    WA.room.area.onLeave("room2oldMap").subscribe(closePopup)

    WA.room.area.onEnter("room2coins").subscribe(() => {
        currentPopup = WA.ui.openPopup("room2coinsPopup", "Vous avez trouvé des pièces. 5 de plus et vous pourrez peut-être les échanger contre un billet de banque.", [])
    })
    WA.room.area.onLeave("room2coins").subscribe(closePopup)

    WA.room.onEnterLayer("teleportRoom3").subscribe(() => {
        if (WA.state.TrainStarted) {
            currentPopup = WA.ui.openPopup("teleportRoom3Popup", "Maintenant que le train peut démarrer, vous pouvez passer à la salle suivante !", [
                {
                    label: 'Teleport',
                    className: 'primary',
                    callback: () => {
                        WA.nav.goToRoom("#max-maulwurf");
                        const x = 241*32;
                        const y = 27*32;
                        WA.camera.set(x, y, 500, 500, false, true);
                        WA.state.GameState = "room3";
                    },
                }]
            )
        }
    })
    WA.room.onLeaveLayer("teleportRoom3").subscribe(closePopup)

    // ROOM 3
    WA.room.onEnterLayer("max-maulwurf").subscribe(() => {
        // anti-cheat
        if (!WA.state.TrainStarted) {
            WA.controls.disablePlayerControls()
            currentPopup = WA.ui.openPopup("room3Popup", cheatWarning, [])
        }
    })
    WA.room.onLeaveLayer("max-maulwurf").subscribe(closePopup)

    WA.room.area.onEnter("trainRoom3").subscribe(() => {
        currentPopup = WA.ui.openPopup("room3Popup", "Oups, on dirait que le train a été arrêté immédiatement ! Enquêtez sur la zone pour découvrir ce qui s'est passé 💥", [])
    })
    WA.room.area.onLeave("trainRoom3").subscribe(closePopup)

    WA.room.area.onEnter("room3bot").subscribe(() => {
        if (WA.state.isMaxHappy) return
        currentPopup = WA.ui.openPopup("room3botPopup", "Stranger, it seems your beloved Max Maulwurf is hungry. You will be blocked here until you comfort him. " + clueWarning, [
            {
                label: 'Give me a clue',
                className: 'primary',
                callback: () => giveClue(3),
            }
        ])
    })
    WA.room.area.onLeave("room3bot").subscribe(closePopup)

    WA.room.area.onEnter("room3helmet").subscribe(() => {
        currentPopup = WA.ui.openPopup("room3helmetPopup", "Vous avez trouvé le casque de travail jaune ! Cela devrait aider à calmer Max Maulwurf 🪖", [])
        WA.state.helmetFound = true
    })
    WA.room.area.onLeave("room3helmet").subscribe(closePopup)

    WA.room.area.onEnter("room3DBtrophy").subscribe(() => {
        currentPopup = WA.ui.openPopup("room3DBtrophyPopup", "Génial, vous avez trouvé le trophé Nexton ! Cela devrait calmer Max You Maulwurf 🏆", [])
        WA.state.DBtrophyFound = true
    })
    WA.room.area.onLeave("room3DBtrophy").subscribe(closePopup)

    WA.room.area.onEnter("room3WAmug").subscribe(() => {
        currentPopup = WA.ui.openPopup("room3WAmugPopup", "Vous avez trouvé la tasse à café WorkAdventure ! Cela devrait aider à calmer Max Maulwurf ☕", [])
        WA.state.WAmugFound = true
    })
    WA.room.area.onLeave("room3WAmug").subscribe(closePopup)

    WA.room.area.onEnter("maxMaulwurf").subscribe(() => {
        if (WA.state.powerRestarted) {
            currentPopup = WA.ui.openPopup("maxMaulwurfPopup", "Un grand mercie d'avoir réparé la gare 😍", [])
        } else if (WA.state.WAmugFound && WA.state.helmetFound && WA.state.DBtrophyFound) {
            WA.room.hideLayer("maxHungry")
            WA.room.showLayer("maxHappy")
            currentPopup = WA.ui.openPopup("maxMaulwurfPopup", "Vous donnez les 3 objets à Max. Après avoir reçu tous les objets, il se calme et fait une pause en regardant son casque bien-aimé. "
            + "Il se souvient de son passage à la Nexton : sa tâche principale était d'informer sur la construction et les réparations... "
            + "Il s'excuse et accepte d'allumer l'alimentation électrique. Dépêchez-vous et redémarrez le système de contrôle de la circulation des trains au terminal pour éviter de nouveaux retards ! ", [])
            WA.state.isMaxHappy = true
        } else {
            currentPopup = WA.ui.openPopup("maxMaulwurfPopup", "Max a l'air affamé... on dirait que c'est lui qui a causé les dégâts dans la centrale électrique "
            + "parce qu'il est fou de ne plus être la mascotte des chemins de fer.", [])
        }
    })
    WA.room.area.onLeave("maxMaulwurf").subscribe(closePopup)

    WA.room.area.onEnter("terminal").subscribe(() => {
        if (WA.state.isMaxHappy) {
            if (WA.state.powerRestarted) {
                WA.nav.openCoWebSite(WA.state.formURL as string)
            } else {
                currentPopup = WA.ui.openPopup("terminalPopup", "Il semble que vous deviez redémarrer le système pour terminer votre mission ! 💻", [
                    {
                        label: 'RESTART',
                        className: 'primary',
                        callback: () => restartPower(),
                    }
                ])
            }
        } else {
            currentPopup = WA.ui.openPopup("terminalPopup", "C'est le terminal... mais il est hors service ⛔", [])
        }
    })
    WA.room.area.onLeave("terminal").subscribe(() => {
        closeEverything()
    });

    WA.room.area.onEnter("startZone").subscribe(() => {
        openStartPopup();
    });
    WA.room.area.onLeave("startZone").subscribe(() => {
        closePopup();
    });

    // The line below bootstraps the Scripting API Extra library that adds a number of advanced properties/features to WorkAdventure
    bootstrapExtra().then(() => {
        console.log('Scripting API Extra ready');
        const GameStarted = WA.state.onVariableChange('GameStarted').subscribe((value) => {
            if (value === true) {
                WA.ui.website.open(information)
                GameStarted.unsubscribe();
                closePopup();
                WA.controls.restorePlayerControls()
            }
        });

        WA.state.onVariableChange('TicTacToeComplete').subscribe((value) => {
            if (value === true) {
                WA.state.QuestionReady = WA.state.CigaretteComplete;
            }
        })
        WA.state.onVariableChange('CigaretteComplete').subscribe((value) => {
            if (value === true) {
                WA.state.QuestionReady = WA.state.TicTacToeComplete;
            }
        });
        if (WA.state.GameStarted === false) {
            openStartPopup();
            WA.controls.disablePlayerControls();
        } else {
            WA.ui.website.open(information)
        }
    }).catch(e => console.error(e));

}).catch(e => console.error(e));

function openStartPopup() {
    currentPopup = WA.ui.openPopup("startPopup", "Vous venez d'atterrir dans une gare abandonnée. En cliquant sur le bouton 'C'est parti !', le chronomètre de 20 minutes démarre. Votre mission, trouver et résoudre toutes les énigmes présentes danc cette gare. Bon chance... 🚀", [
       {
           label: "C'est parti !",
           className: 'error',
           callback: () => {
               WA.state.GameStarted = true;
               closePopup();
               WA.controls.restorePlayerControls();
           },
       }
   ]);
}

function closePopup(){
    if (currentPopup !== undefined) {
        currentPopup.close();
        currentPopup = undefined;
    }
}

async function closeEverything(){
    closePopup()

    const websites = await WA.nav.getCoWebSites()
    if (websites.length) {
        WA.nav.closeCoWebSite()
    }
}

function giveClue(roomNumber: number){
    let variableName = ""
    for (let i = 1; i < 4; i++) {
        variableName = `Room${roomNumber}Clue${i}`
        // If the next clue has not been shown: show it
        if (WA.state.loadVariable(variableName) === false) {
            WA.state.saveVariable(variableName, true);
            return
        }
    }
}

function restartPower(){
    closePopup()
    WA.state.powerRestarted = true
    WA.nav.openCoWebSite(WA.state.formURL as string)
}

export {};
