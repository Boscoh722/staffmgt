import { useEffect } from 'react';

const useDocumentTitle = (title) => {
    useEffect(() => {
        const originalTitle = document.title;

        if (title) {
            document.title = `${title} | Makongeni Ward Staff`;
        }

        return () => {
            document.title = originalTitle;
        };
    }, [title]);
};

export default useDocumentTitle;
