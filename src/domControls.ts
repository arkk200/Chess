import { DatabaseReference, update } from "firebase/database";

class DomControls {
    mainScreen: HTMLDivElement;
    joinButton: HTMLButtonElement;
    waitingModal: HTMLDivElement;
    gameScreen: HTMLDivElement;
    giveupButton: HTMLButtonElement;

    constructor() {
        this.mainScreen = document.querySelector('.main-screen')!;
        this.joinButton = document.querySelector('.start-btn')!;
        this.waitingModal = document.querySelector('.waiting-modal')!;
        this.gameScreen = document.querySelector('.game-screen')!;
        this.giveupButton = document.querySelector('.giveup-btn')!;
    }
    
    setupJoinButton: () => HTMLButtonElement = () => {
        this.joinButton = <HTMLButtonElement>document.querySelector('.start-btn');
        this.joinButton.disabled = false;
        return this.joinButton;
    }

    setupWaitingModal = () => {
        this.waitingModal.classList.remove('hide');
    }

    setupGameScreen = (ridref: DatabaseReference, playerColor: string) => {
        this.mainScreen.classList.add('hide');
        this.gameScreen.classList.remove('hide');

        this.giveupButton.addEventListener('click', () => {
            const ok = confirm("Are you sure you want to give up?");
            if (ok) {
                update(ridref, { winner: playerColor === "W" ? "B" : "W" });
            }
        });
    }
}



export default DomControls;