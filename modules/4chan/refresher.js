import { refreshers } from '../../lib/Refreshers/4chan/Refresher';

export default function refresher() {
    refreshers.forEach((refresher) => refresher());
}
