import React from 'react';

export default function FileUploadIcon(props) {
    return (
        <svg
            width={props.width}
            height={props.height}
            viewBox={props.viewBox}
            fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path
                d="M28 25.3333V6.66667C28 5.2 26.8 4 25.3333 4H6.66667C5.2 4 4 5.2 4 6.66667V25.3333C4 26.8 5.2 28 6.66667 28H25.3333C26.8 28 28 26.8 28 25.3333ZM11.8667 18.64L14.6667 22.0133L18.8 16.6933C19.0667 16.3467 19.6 16.3467 19.8667 16.7067L24.5467 22.9467C24.88 23.3867 24.56 24.0133 24.0133 24.0133H8.02667C7.46667 24.0133 7.16 23.3733 7.50667 22.9333L10.8267 18.6667C11.08 18.32 11.5867 18.3067 11.8667 18.64V18.64Z"
                fill="black"
            />
        </svg>
    );
}

FileUploadIcon.defaultProps = {
    height: 32,
    width: 32,
    viewBox: '0 0 32 32',
};
