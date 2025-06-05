import { Player } from '@lottiefiles/react-lottie-player';

export default function LottiePlayer({ src, loop = true, autoplay = true, size = 100 }) {
    return (
        <div className="flex justify-center items-center">
            <Player
                autoplay={autoplay}
                loop={loop}
                src={src}
                style={{ height: size, width: size }}
            />
        </div>
    );
}
