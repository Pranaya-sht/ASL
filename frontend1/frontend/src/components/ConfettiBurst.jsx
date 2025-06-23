import Confetti from 'react-confetti';
import { useWindowSize } from 'react-use';

export default function ConfettiBurst({ trigger }) {
    const { width, height } = useWindowSize();
    return (
        <>
            {trigger && <Confetti width={width} height={height} />}
        </>
    );
}
