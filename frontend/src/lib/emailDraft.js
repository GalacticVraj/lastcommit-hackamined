const openExternal = (url) => {
    const popup = window.open(url, '_blank', 'noopener,noreferrer');
    if (!popup) {
        window.location.href = url;
    }
};

export const openEmailDraftOptions = ({ to = '', subject = '', body = '' }) => {
    const choice = window.prompt(
        'Choose email option:\n1) Default Mail App\n2) Gmail (Web)\n3) Outlook (Web)\n\nEnter 1, 2, or 3',
        '1'
    );

    if (!choice) return { opened: false, channel: null };

    const selected = String(choice).trim();

    if (selected === '2') {
        const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        openExternal(gmailUrl);
        return { opened: true, channel: 'Gmail' };
    }

    if (selected === '3') {
        const outlookUrl = `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        openExternal(outlookUrl);
        return { opened: true, channel: 'Outlook Web' };
    }

    const mailtoUrl = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    return { opened: true, channel: 'Default Mail App' };
};
