import { Formik, FormikHelpers } from 'formik';
import React, { useContext, useRef, useState } from 'react';
import * as Yup from 'yup';
import constants from 'utils/strings/constants';
import SubmitButton from 'components/SubmitButton';
import router from 'next/router';
import { changeEmail, getOTTForEmailChange } from 'services/userService';
import { AppContext, FLASH_MESSAGE_TYPE } from 'pages/_app';
import { getData, LS_KEYS, setData } from 'utils/storage/localStorage';
import { PAGES } from 'constants/pages';
import { Alert, TextField } from '@mui/material';
import Container from './Container';
import LinkButton from './pages/gallery/LinkButton';
import FormPaperFooter from './Form/FormPaper/Footer';

interface formValues {
    email: string;
    ott?: string;
}

function ChangeEmailForm() {
    const [loading, setLoading] = useState(false);
    const [ottInputVisible, setShowOttInputVisibility] = useState(false);
    const ottInputRef = useRef(null);
    const appContext = useContext(AppContext);
    const [email, setEmail] = useState(null);
    const [showMessage, setShowMessage] = useState(false);

    const requestOTT = async (
        { email }: formValues,
        { setFieldError }: FormikHelpers<formValues>
    ) => {
        try {
            setLoading(true);
            await getOTTForEmailChange(email);
            setEmail(email);
            setShowOttInputVisibility(true);
            setShowMessage(true);
            setTimeout(() => {
                ottInputRef.current?.focus();
            }, 250);
        } catch (e) {
            setFieldError('email', `${constants.EMAIl_ALREADY_OWNED}`);
        }
        setLoading(false);
    };

    const requestEmailChange = async (
        { email, ott }: formValues,
        { setFieldError }: FormikHelpers<formValues>
    ) => {
        try {
            setLoading(true);
            await changeEmail(email, ott);
            setData(LS_KEYS.USER, { ...getData(LS_KEYS.USER), email });
            appContext.setDisappearingFlashMessage({
                message: constants.EMAIL_UDPATE_SUCCESSFUL,
                type: FLASH_MESSAGE_TYPE.SUCCESS,
            });
            router.push(PAGES.GALLERY);
        } catch (e) {
            setFieldError('ott', `${constants.INCORRECT_CODE}`);
        }
        setLoading(false);
    };

    const goToGallery = () => router.push(PAGES.GALLERY);

    const closeMessage = () => setShowMessage(false);
    return (
        <Formik<formValues>
            initialValues={{ email: '' }}
            validationSchema={Yup.object().shape({
                email: Yup.string()
                    .email(constants.EMAIL_ERROR)
                    .required(constants.REQUIRED),
                ott:
                    ottInputVisible &&
                    Yup.string().required(constants.REQUIRED),
            })}
            validateOnChange={false}
            validateOnBlur={false}
            onSubmit={!ottInputVisible ? requestOTT : requestEmailChange}>
            {({ values, errors, handleChange, handleSubmit }) => (
                <>
                    {showMessage && (
                        <Alert severity="success" onClose={closeMessage}>
                            {constants.EMAIL_SENT({ email })}
                        </Alert>
                    )}
                    <form noValidate onSubmit={handleSubmit}>
                        <Container>
                            <TextField
                                fullWidth
                                InputProps={{
                                    readOnly: ottInputVisible,
                                }}
                                type="email"
                                label={constants.ENTER_EMAIL}
                                value={values.email}
                                onChange={handleChange('email')}
                                error={Boolean(errors.email)}
                                helperText={errors.email}
                                autoFocus
                                disabled={loading}
                            />
                            {ottInputVisible && (
                                <TextField
                                    fullWidth
                                    type="text"
                                    label={constants.ENTER_OTT}
                                    value={values.ott}
                                    onChange={handleChange('ott')}
                                    error={Boolean(errors.ott)}
                                    helperText={errors.ott}
                                    disabled={loading}
                                />
                            )}
                            <SubmitButton
                                sx={{ mt: 2 }}
                                loading={loading}
                                buttonText={
                                    !ottInputVisible
                                        ? constants.SEND_OTT
                                        : constants.VERIFY
                                }
                            />
                        </Container>
                    </form>

                    <FormPaperFooter
                        style={{
                            justifyContent: ottInputVisible && 'space-between',
                        }}>
                        {ottInputVisible && (
                            <LinkButton
                                onClick={() =>
                                    setShowOttInputVisibility(false)
                                }>
                                {constants.CHANGE_EMAIL}?
                            </LinkButton>
                        )}
                        <LinkButton onClick={goToGallery}>
                            {constants.GO_BACK}
                        </LinkButton>
                    </FormPaperFooter>
                </>
            )}
        </Formik>
    );
}

export default ChangeEmailForm;
