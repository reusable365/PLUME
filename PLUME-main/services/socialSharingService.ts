/**
 * Social Sharing Service
 * Provides functions to share content via various social platforms
 */

interface ShareData {
    title: string;
    text: string;
    url: string;
}

export class SocialSharingService {
    /**
     * Generate a shareable URL for a guest contribution
     */
    static generateGuestInvitationUrl(souvenirId: string, authorName: string): string {
        const baseUrl = window.location.origin;
        // In production, this would be a proper deep link
        return `${baseUrl}/?guest=${souvenirId}&author=${encodeURIComponent(authorName)}`;
    }

    /**
     * Share via WhatsApp
     */
    static shareViaWhatsApp(souvenirTitle: string, authorName: string, invitationUrl: string): void {
        const message = `${authorName} vous invite à partager vos souvenirs de "${souvenirTitle}" 📖\n\nContribuez à son livre de vie :\n${invitationUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    }

    /**
     * Share via Email
     */
    static shareViaEmail(souvenirTitle: string, authorName: string, invitationUrl: string): void {
        const subject = `${authorName} vous invite à partager un souvenir`;
        const body = `Bonjour,

${authorName} écrit le livre de sa vie avec PLUME et aimerait enrichir le chapitre "${souvenirTitle}" avec vos propres souvenirs.

Votre contribution est précieuse ! Cliquez sur le lien ci-dessous pour partager votre version de cette histoire :

${invitationUrl}

À bientôt,
L'équipe PLUME`;

        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.location.href = mailtoUrl;
    }

    /**
     * Copy link to clipboard
     */
    static async copyLinkToClipboard(invitationUrl: string): Promise<boolean> {
        try {
            await navigator.clipboard.writeText(invitationUrl);
            return true;
        } catch (err) {
            console.error('Failed to copy link:', err);
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = invitationUrl;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            document.body.appendChild(textArea);
            textArea.select();
            try {
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            } catch (err2) {
                document.body.removeChild(textArea);
                return false;
            }
        }
    }

    /**
     * Share via Facebook (opens share dialog)
     */
    static shareViaFacebook(invitationUrl: string): void {
        const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(invitationUrl)}`;
        window.open(facebookUrl, '_blank', 'width=600,height=400');
    }

    /**
     * Share via Twitter/X
     */
    static shareViaTwitter(souvenirTitle: string, authorName: string, invitationUrl: string): void {
        const text = `${authorName} m'invite à partager mes souvenirs de "${souvenirTitle}" 📖`;
        const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(invitationUrl)}`;
        window.open(twitterUrl, '_blank', 'width=600,height=400');
    }

    /**
     * Use Web Share API if available (mobile-friendly)
     */
    static async shareViaWebAPI(shareData: ShareData): Promise<boolean> {
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                return true;
            } catch (err) {
                if ((err as Error).name !== 'AbortError') {
                    console.error('Error sharing:', err);
                }
                return false;
            }
        }
        return false;
    }
}
