/* tslint:disable:file-header */
/* tslint:disable:no-empty */

import * as React from "react";
import videojs from "video.js";
import "video.js/dist/video-js.css";

const Controls: IControls = {
    fullscreen: "fullscreenToggle",
    play: "playToggle",
    playbackrates: "playbackRateMenuButton",
    seekbar: "progressControl",
    timer: "remainingTimeDisplay",
    volume: "volumePanel",
};

interface IControls {
    [key: string]: string;
}

interface IProps {
    autoplay?: boolean;
    bigPlayButton?: boolean;
    bigPlayButtonCentered?: boolean;
    className?: string;
    controls?: boolean;
    height?: number | string;
    hideControls?: string[];
    hidePlaybackRates?: boolean;
    playbackRates?: number[];
    poster?: string;
    preload?: "auto" | "none" | "metadata";
    src: string;
    type: string;
    width?: number | string;

    onReady?: (vjs: videojs.Player) => any;
    onPlay?: (currentTime: number) => any;
    onPause?: (currentTime: number) => any;
    onTimeUpdate?: (currentTime: number) => any;
    onSeeking?: (currentTime: number) => any;
    onSeeked?: (position: number, currentTime: number) => any;
    onEnd?: () => any;
}

// TODO Figure out why these aren't defined in @types/videojs
type PlayerOptions = videojs.PlayerOptions & {
    bigPlayButton: boolean | undefined;
};

class VideoPlayer extends React.Component<IProps, {}> {
    // TODO Make typescript realize there are default props being set.
    public static defaultProps = {
        autoplay: false,
        bigPlayButton: true,
        bigPlayButtonCentered: true,
        className: "",
        controls: true,
        hideControls: [],
        hidePlaybackRates: false,
        onEnd: () => {},
        onPause: () => {},
        onPlay: () => {},
        onReady: () => {},
        onSeeked: () => {},
        onSeeking: () => {},
        onTimeUpdate: () => {},
        playbackRates: [0.5, 1, 1.5, 2],
        poster: "",
        preload: "auto",
        src: "",
        type: "",
    };

    private player = {} as videojs.Player;
    private playerId = `video-player-${new Date().getTime()}`;

    public componentDidMount() {
        this.init_player(this.props);
        this.init_player_events(this.props);
    }

    public componentWillReceiveProps(nextProps: IProps) {
        this.set_controls_visibility(this.player!, nextProps.hideControls);
        if (this.props.src !== nextProps.src) {
            this.init_player(nextProps);
        }
    }

    public componentWillUnmount() {
        if (this.player) {
            this.player.dispose();
        }
    }

    public render() {
        const playButtonCss = this.props.bigPlayButtonCentered ? "vjs-big-play-centered" : "";
        return (
            <video
                id={this.playerId}
                className={`video-js ${playButtonCss} ${this.props.className}`}>
            </video>
        );
    }

    private init_player(props: IProps) {
        const playerOptions = this.generate_player_options(props);
        this.player = videojs(document.querySelector(`#${this.playerId}`), playerOptions);
        this.player.src({
            src: props.src,
            type: props.type || "video/mp4", // Fall back to video/mp4 if nothing is provided
        });
        if (props.poster) {
            this.player.poster(props.poster);
        }

        this.set_controls_visibility(this.player, props.hideControls);
    }

    private generate_player_options(props: IProps) {
        const playerOptions = {} as PlayerOptions;
        playerOptions.controls = props.controls;
        playerOptions.autoplay = props.autoplay;
        playerOptions.preload = props.preload;
        playerOptions.width = props.width as number | undefined;
        playerOptions.height = props.height as number | undefined;
        playerOptions.bigPlayButton = props.bigPlayButton;
        const hidePlaybackRates = props.hidePlaybackRates || props.hideControls!.includes("playbackrates");
        if (!hidePlaybackRates) {
            playerOptions.playbackRates = props.playbackRates;
        }
        return playerOptions;
    }

    private set_controls_visibility(player: videojs.Player, hiddenControls: IProps["hideControls"]) {
        Object.keys(Controls).map((x: string) => {
            (player as any).controlBar[Controls[x]].show();
        });
        hiddenControls!.map((x) => {
            (player as any).controlBar[Controls[x]].hide();
        });
    }

    private init_player_events(props: IProps) {
        let currentTime = 0;
        let previousTime = 0;
        let position = 0;

        this.player.ready(() => {
            if (typeof props.onReady === "function") {
                props.onReady(this.player)
            }

            // TODO Figure out why this player needs to be attached to window
            (window as (Window & {player?: videojs.Player})).player = this.player;
        });
        this.player.on("play", () => {
            if (typeof props.onPlay === "function") {
                props.onPlay(this.player.currentTime());
            }
        });
        this.player.on("pause", () => {
            if (typeof props.onPause === "function") {
                props.onPause(this.player.currentTime());
            }
        });
        this.player.on("timeupdate", () => {
            if (typeof props.onTimeUpdate === "function") {
                props.onTimeUpdate(this.player.currentTime());
            }

            previousTime = currentTime;
            currentTime = this.player.currentTime();
            if (previousTime < currentTime) {
                position = previousTime;
                previousTime = currentTime;
            }
        });
        this.player.on("seeking", () => {
            this.player.off("timeupdate", () => { });
            this.player.one("seeked", () => { });
            if (typeof props.onSeeking === "function") {
                props.onSeeking(this.player.currentTime());
            }
        });
        this.player.on("seeked", () => {
            const completeTime = Math.floor(this.player.currentTime());
            if (typeof props.onSeeked === "function") {
                props.onSeeked(position, completeTime);
            }
        });
        this.player.on("ended", () => {
            if (typeof props.onEnd === "function") {
                props.onEnd();
            }
        });
    }
}

export default VideoPlayer;
