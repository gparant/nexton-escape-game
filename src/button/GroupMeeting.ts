/// <reference types="@workadventure/iframe-api-typings/iframe_api" />

//@ts-ignore
console.info('Join Meeting Script started successfully');

interface AskMeetingVariable {
    inprogress: boolean,
    position: {x: number, y: number},
    userUuid: string
}

let timeOutMeeting: NodeJS.Timeout;

WA.onInit().then(() => {
    if(!WA.state.hasVariable('askMeeting')) WA.state.saveVariable('askMeeting', {inprogress: false});

    WA.room.area.onEnter('jitsiMeetingZone').subscribe(() => {
        addAskToJoinMeetingButton();
    });

    WA.room.area.onLeave('jitsiMeetingZone').subscribe(() => {
        removeAskButton();
    })

    WA.state.onVariableChange('askMeeting').subscribe((askMeeting) => {
        if((askMeeting as AskMeetingVariable).userUuid === WA.player.uuid) return;
        if((askMeeting as AskMeetingVariable).inprogress){
            addJoinMeetingButton(askMeeting as AskMeetingVariable);
        }else{
            removeJoinMeetingButton();
        }
    });
});

const addAskToJoinMeetingButton = () => {
    // @ts-ignore
    WA.ui.actionBar.addButton({
        id: 'asktojoinmeeting-btn',
        label: 'Ask Group Meeting',
        callback: async () => {
            let positions = await WA.player.getPosition();
            WA.state.askMeeting = {
                inprogress: true,
                userUuid: WA.player.uuid,
                position: positions
            };
            removeAskButton();

            // After 10 seconds, if the user has not joined the meeting, we remove the button
            if(timeOutMeeting) clearTimeout(timeOutMeeting);
            timeOutMeeting = setTimeout(() => {
                // @ts-ignore
                WA.state.askMeeting = {inprogress: false};
            }, 20000);
        }
    });
};

const removeAskButton = () => {
    // @ts-ignore
    WA.ui.actionBar.removeButton('asktojoinmeeting-btn');
}

const addJoinMeetingButton = (askMeeting: AskMeetingVariable) => {
    // @ts-ignore
    WA.ui.actionBar.addButton({
        id: 'joinmeeting-btn',
        label: 'Join Group Meeting',
        callback: () => {
            WA.player.moveTo(askMeeting.position.x, askMeeting.position.y, 10);
            removeJoinMeetingButton();
        }
    });

    // @ts-ignore
    WA.ui.banner.openBanner({
        id: "banner-joinmeeting",
        text: "A group meeting is in progress, click on the button 'Join Group Meeting' to walk to the group meeting area.",
        bgColor: "#000000",
        textColor: "#ffffff",
        closable: true
    });
};

const removeJoinMeetingButton = () => {
    // @ts-ignore
    WA.ui.actionBar.removeButton('joinmeeting-btn');
    // @ts-ignore
    WA.ui.banner.closeBanner('banner-joinmeeting');
}


export {};