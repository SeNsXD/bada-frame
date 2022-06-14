import { EnteCheckbox } from './EnteCheckbox';
import React, { useState } from 'react';
import constants from 'utils/strings/constants';
import { Formik, FormikHelpers } from 'formik';
import * as Yup from 'yup';
import { getOtt } from 'services/userService';
import { setData, LS_KEYS } from 'utils/storage/localStorage';
import { useRouter } from 'next/router';
import SubmitButton from 'components/SubmitButton';
import {
    generateAndSaveIntermediateKeyAttributes,
    generateKeyAttributes,
    SaveKeyInSessionStore,
} from 'utils/crypto';
import { setJustSignedUp } from 'utils/storage';
import { logError } from 'utils/sentry';
import { SESSION_KEYS } from 'utils/storage/sessionStorage';
import { PAGES } from 'constants/pages';
import { FormGroup, TextField } from '@mui/material';
import FormPaperTitle from './Form/FormPaper/Title';
import LinkButton from './pages/gallery/LinkButton';
import FormPaperFooter from './Form/FormPaper/Footer';
import VerticallyCentered from './Container';

interface FormValues {
    email: string;
    passphrase: string;
    confirm: string;
}

interface SignUpProps {
    login: () => void;
}

export default function SignUp(props: SignUpProps) {
    const router = useRouter();
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [loading, setLoading] = useState(false);

    const registerUser = async (
        { email, passphrase, confirm }: FormValues,
        { setFieldError }: FormikHelpers<FormValues>
    ) => {
        setLoading(true);
        try {
            try {
                setData(LS_KEYS.USER, { email });
                await getOtt(email);
            } catch (e) {
                setFieldError(
                    'confirm',
                    `${constants.UNKNOWN_ERROR} ${e.message}`
                );
                throw e;
            }
            try {
                if (passphrase === confirm) {
                    const { keyAttributes, masterKey } =
                        await generateKeyAttributes(passphrase);
                    setData(LS_KEYS.ORIGINAL_KEY_ATTRIBUTES, keyAttributes);
                    await generateAndSaveIntermediateKeyAttributes(
                        passphrase,
                        keyAttributes,
                        masterKey
                    );

                    await SaveKeyInSessionStore(
                        SESSION_KEYS.ENCRYPTION_KEY,
                        masterKey
                    );
                    setJustSignedUp(true);
                    router.push(PAGES.VERIFY);
                } else {
                    setFieldError('confirm', constants.PASSPHRASE_MATCH_ERROR);
                }
            } catch (e) {
                setFieldError(
                    'passphrase',
                    constants.PASSWORD_GENERATION_FAILED
                );
                throw e;
            }
        } catch (err) {
            logError(err, 'signup failed');
        }
        setLoading(false);
    };

    return (
        <>
            <FormPaperTitle> {constants.SIGN_UP}</FormPaperTitle>
            <Formik<FormValues>
                initialValues={{
                    email: '',
                    passphrase: '',
                    confirm: '',
                }}
                validationSchema={Yup.object().shape({
                    email: Yup.string()
                        .email(constants.EMAIL_ERROR)
                        .required(constants.REQUIRED),
                    passphrase: Yup.string().required(constants.REQUIRED),
                    confirm: Yup.string().required(constants.REQUIRED),
                })}
                validateOnChange={false}
                validateOnBlur={false}
                onSubmit={registerUser}>
                {({
                    values,
                    errors,
                    handleChange,
                    handleSubmit,
                }): JSX.Element => (
                    <form noValidate onSubmit={handleSubmit}>
                        <VerticallyCentered sx={{ mb: 1 }}>
                            <TextField
                                fullWidth
                                type="email"
                                label={constants.ENTER_EMAIL}
                                value={values.email}
                                onChange={handleChange('email')}
                                error={Boolean(errors.email)}
                                helperText={errors.email}
                                autoFocus
                                disabled={loading}
                            />

                            <TextField
                                fullWidth
                                type="password"
                                label={constants.PASSPHRASE_HINT}
                                value={values.passphrase}
                                onChange={handleChange('passphrase')}
                                error={Boolean(errors.passphrase)}
                                helperText={errors.passphrase}
                                disabled={loading}
                            />

                            <TextField
                                fullWidth
                                type="password"
                                label={constants.CONFIRM_PASSPHRASE}
                                value={values.confirm}
                                onChange={handleChange('confirm')}
                                error={Boolean(errors.confirm)}
                                helperText={errors.confirm}
                                disabled={loading}
                            />
                            <FormGroup sx={{ width: '100%' }}>
                                <EnteCheckbox
                                    label={constants.TERMS_AND_CONDITIONS()}
                                    loading={loading}
                                    value={acceptTerms}
                                    onChange={setAcceptTerms}
                                />
                            </FormGroup>
                        </VerticallyCentered>
                        <SubmitButton
                            sx={{ my: 4 }}
                            buttonText={constants.CREATE_ACCOUNT}
                            loading={loading}
                            disabled={!acceptTerms}
                        />
                    </form>
                )}
            </Formik>

            <FormPaperFooter>
                <LinkButton onClick={props.login}>
                    {constants.ACCOUNT_EXISTS}
                </LinkButton>
            </FormPaperFooter>
        </>
    );
}
