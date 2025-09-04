const fullName = (firstName, lastName) => {
    let fullName = "User";
    if (firstName && lastName) {
        fullName = `${firstName} ${lastName}`;
    } else if (firstName) {
        fullName = firstName;
    }
    return fullName;
}

export { fullName };
