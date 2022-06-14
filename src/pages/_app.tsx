import React, { createContext, useEffect, useRef, useState } from 'react';
import styled, { ThemeProvider as SThemeProvider } from 'styled-components';
import AppNavbar from 'components/Navbar/app';
import constants from 'utils/strings/constants';
import { useRouter } from 'next/router';
import VerticallyCentered from 'components/Container';
import 'photoswipe/dist/photoswipe.css';
import 'styles/global.css';
import EnteSpinner from 'components/EnteSpinner';
import { logError } from '../utils/sentry';
// import { Workbox } from 'workbox-window';
import { getData, LS_KEYS } from 'utils/storage/localStorage';
import HTTPService from 'services/HTTPService';
import FlashMessageBar, { FlashMessage } from 'components/FlashMessageBar';
import Head from 'next/head';
import { logUploadInfo } from 'utils/upload';
import LoadingBar from 'react-top-loading-bar';
import DialogBox from 'components/DialogBox';
import { ThemeProvider as MThemeProvider } from '@mui/material/styles';
import darkThemeOptions from 'themes/darkThemeOptions';
import { CssBaseline } from '@mui/material';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as types from 'styled-components/cssprop'; // need to css prop on styled component
import { SetDialogBoxAttributes, DialogBoxAttributes } from 'types/dialogBox';
import {
    getFamilyPortalRedirectURL,
    getRoadmapRedirectURL,
} from 'services/userService';
import { CustomError } from 'utils/error';

export const MessageContainer = styled.div`
    background-color: #111;
    padding: 0;
    font-size: 14px;
    text-align: center;
    line-height: 32px;
`;

export interface BannerMessage {
    message: string;
    variant: string;
}

type AppContextType = {
    showNavBar: (show: boolean) => void;
    sharedFiles: File[];
    resetSharedFiles: () => void;
    setDisappearingFlashMessage: (message: FlashMessage) => void;
    redirectURL: string;
    setRedirectURL: (url: string) => void;
    startLoading: () => void;
    finishLoading: () => void;
    closeMessageDialog: () => void;
    setDialogMessage: SetDialogBoxAttributes;
};

export const AppContext = createContext<AppContextType>(null);

const redirectMap = new Map([
    ['roadmap', getRoadmapRedirectURL],
    ['families', getFamilyPortalRedirectURL],
]);

export default function App({ Component, err }) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [offline, setOffline] = useState(
        typeof window !== 'undefined' && !window.navigator.onLine
    );
    const [showNavbar, setShowNavBar] = useState(false);
    const [sharedFiles, setSharedFiles] = useState<File[]>(null);
    const [redirectName, setRedirectName] = useState<string>(null);
    const [flashMessage, setFlashMessage] = useState<FlashMessage>(null);
    const [redirectURL, setRedirectURL] = useState(null);
    const isLoadingBarRunning = useRef(false);
    const loadingBar = useRef(null);
    const [dialogMessage, setDialogMessage] = useState<DialogBoxAttributes>();
    const [messageDialogView, setMessageDialogView] = useState(false);

    useEffect(() => {
        if (
            !('serviceWorker' in navigator) ||
            process.env.NODE_ENV !== 'production'
        ) {
            console.warn('Progressive Web App support is disabled');
            return;
        }
        // const wb = new Workbox('sw.js', { scope: '/' });
        // wb.register();

        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.onmessage = (event) => {
                if (event.data.action === 'upload-files') {
                    const files = event.data.files;
                    setSharedFiles(files);
                }
            };
            navigator.serviceWorker
                .getRegistrations()
                .then(function (registrations) {
                    for (const registration of registrations) {
                        registration.unregister();
                    }
                });
        }

        HTTPService.getInterceptors().response.use(
            (resp) => resp,
            (error) => {
                logError(error, 'Network Error');
                return Promise.reject(error);
            }
        );
    }, []);

    const setUserOnline = () => setOffline(false);
    const setUserOffline = () => setOffline(true);
    const resetSharedFiles = () => setSharedFiles(null);

    useEffect(() => {
        if (process.env.NODE_ENV === 'production') {
            console.log(
                `%c${constants.CONSOLE_WARNING_STOP}`,
                'color: red; font-size: 52px;'
            );
            console.log(
                `%c${constants.CONSOLE_WARNING_DESC}`,
                'font-size: 20px;'
            );
        }

        const redirectTo = async (redirect) => {
            if (
                redirectMap.has(redirect) &&
                typeof redirectMap.get(redirect) === 'function'
            ) {
                const redirectAction = redirectMap.get(redirect);
                const url = await redirectAction();
                window.location.href = url;
            } else {
                logError(CustomError.BAD_REQUEST, 'invalid redirection', {
                    redirect,
                });
            }
        };

        const query = new URLSearchParams(window.location.search);
        const redirectName = query.get('redirect');
        if (redirectName) {
            const user = getData(LS_KEYS.USER);
            if (user?.token) {
                redirectTo(redirectName);
            } else {
                setRedirectName(redirectName);
            }
        }

        router.events.on('routeChangeStart', (url: string) => {
            if (window.location.pathname !== url.split('?')[0]) {
                setLoading(true);
            }

            if (redirectName) {
                const user = getData(LS_KEYS.USER);
                if (user?.token) {
                    redirectTo(redirectName);

                    // https://github.com/vercel/next.js/issues/2476#issuecomment-573460710
                    // eslint-disable-next-line no-throw-literal
                    throw 'Aborting route change, redirection in process....';
                }
            }
        });

        router.events.on('routeChangeComplete', () => {
            setLoading(false);
        });

        window.addEventListener('online', setUserOnline);
        window.addEventListener('offline', setUserOffline);

        return () => {
            window.removeEventListener('online', setUserOnline);
            window.removeEventListener('offline', setUserOffline);
        };
    }, [redirectName]);

    useEffect(() => {
        logUploadInfo(`app started`);
        logUploadInfo(
            `latest commit id :${process.env.NEXT_PUBLIC_LATEST_COMMIT_HASH}`
        );
    }, []);

    useEffect(() => setMessageDialogView(true), [dialogMessage]);

    const showNavBar = (show: boolean) => setShowNavBar(show);
    const setDisappearingFlashMessage = (flashMessages: FlashMessage) => {
        setFlashMessage(flashMessages);
        setTimeout(() => setFlashMessage(null), 5000);
    };

    const startLoading = () => {
        !isLoadingBarRunning.current && loadingBar.current?.continuousStart();
        isLoadingBarRunning.current = true;
    };
    const finishLoading = () => {
        isLoadingBarRunning.current && loadingBar.current?.complete();
        isLoadingBarRunning.current = false;
    };

    const closeMessageDialog = () => setMessageDialogView(false);

    return (
        <>
            <Head>
                <title>{constants.TITLE}</title>
                <meta
                    name="viewport"
                    content="initial-scale=1, width=device-width"
                />
            </Head>

            <MThemeProvider theme={darkThemeOptions}>
                <SThemeProvider theme={darkThemeOptions}>
                    <CssBaseline />
                    {showNavbar && <AppNavbar />}
                    <MessageContainer>
                        {offline && constants.OFFLINE_MSG}
                    </MessageContainer>
                    {sharedFiles &&
                        (router.pathname === '/gallery' ? (
                            <MessageContainer>
                                {constants.FILES_TO_BE_UPLOADED(
                                    sharedFiles.length
                                )}
                            </MessageContainer>
                        ) : (
                            <MessageContainer>
                                {constants.LOGIN_TO_UPLOAD_FILES(
                                    sharedFiles.length
                                )}
                            </MessageContainer>
                        ))}
                    {flashMessage && (
                        <FlashMessageBar
                            flashMessage={flashMessage}
                            onClose={() => setFlashMessage(null)}
                        />
                    )}
                    <LoadingBar color="#51cd7c" ref={loadingBar} />

                    <DialogBox
                        open={messageDialogView}
                        onClose={closeMessageDialog}
                        attributes={dialogMessage}
                    />

                    <AppContext.Provider
                        value={{
                            showNavBar,
                            sharedFiles,
                            resetSharedFiles,
                            setDisappearingFlashMessage,
                            redirectURL,
                            setRedirectURL,
                            startLoading,
                            finishLoading,
                            closeMessageDialog,
                            setDialogMessage,
                        }}>
                        {loading ? (
                            <VerticallyCentered>
                                <EnteSpinner>
                                    <span className="sr-only">Loading...</span>
                                </EnteSpinner>
                            </VerticallyCentered>
                        ) : (
                            <Component err={err} setLoading={setLoading} />
                        )}
                    </AppContext.Provider>
                </SThemeProvider>
            </MThemeProvider>
        </>
    );
}
