import Container from 'components/Container';
import React, { useContext, useEffect, useState } from 'react';
import constants from 'utils/strings/constants';
import { AppContext } from './_app';

export default function NotFound() {
    const appContext = useContext(AppContext);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        appContext.showNavBar(true);
        setLoading(false);
    }, []);
    return (
        <Container>
            {loading ? (
                <span className="sr-only">Loading...</span>
            ) : (
                constants.NOT_FOUND
            )}
        </Container>
    );
}
