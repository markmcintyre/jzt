/*jslint node: true */

var today = new Date(),
    headerText = ['/* ',
              ' * JZT — A DOS-Era Adventure Game for the Web',
              ` * Copyright © ${today.getFullYear()} Mark McIntyre`,
              ' * Created by Mark McIntyre',
              ' * All rights reserved.',
              ' * ',
              ` * Version : ${process.env.npm_package_version}`,
              ` * Released: ${today.toISOString().split("T")[0]}`,
              ' */'].join('\n');

console.log(headerText);