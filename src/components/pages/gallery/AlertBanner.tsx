import { FlexWrapper } from 'components/Container';
import WarningIcon from 'components/icons/WarningIcon';
import React from 'react';
import styled from 'styled-components';
import { VARIANT_COLOR } from './LinkButton';

interface Props {
    bannerMessage?: any;
    variant?: string;
}
const Banner = styled.div`
    border: 1px solid ${VARIANT_COLOR.WARNING};
    border-radius: 8px;
    padding: 16px 28px;
    color: #eee;
    margin-top: 10px;
`;
export default function AlertBanner(props: Props) {
    return props.bannerMessage ? (
        <FlexWrapper>
            <Banner>
                <WarningIcon />
                {props.bannerMessage && props.bannerMessage}
            </Banner>
        </FlexWrapper>
    ) : (
        <></>
    );
}
