var createHTMLFIles = (dataArray, currentIndex, cb, hasFooterContent) => {
   // console.log("INSIDE createHTMLFIles");
    //console.log(dataArray.length + '--- --- --- ' + currentIndex);
    let writableContent = hasFooterContent ? dataArray[currentIndex].footer_content__c : dataArray[currentIndex].article_content__c;
    let fileName = hasFooterContent ? dataArray[currentIndex].id + '_footer' : dataArray[currentIndex].id;
    let writeStream = fs.createWriteStream(process.cwd() + '/dist/HTML files/' + fileName + '.html');

    

    writeStream.write(writableContent, 'utf8');

    writeStream.on('finish', () => {
       // console.log('wrote all data to file');

        if (dataArray[currentIndex].footer_content__c && !hasFooterContent) {
            //Article has footer content
            createHTMLFIles(dataArray, currentIndex, cb, true);
        } else {
            if (currentIndex < dataArray.length - 1) {
                currentIndex = currentIndex + 1;
                createHTMLFIles(dataArray, currentIndex, cb, false);
            } else {
                cb(null, true);
            }
        }
    });

    // close the stream
    writeStream.end();

    // fs.writeFileSync('/dist/HTML files/' + dataArray[currentIndex].id + '.html', dataArray[currentIndex].Article_Content__c, 
    //     function(err) {
    //         if (err) {
    //             throw err;
    //             console.log("HTML file creation err");
    //             cb(false, null);

    //         } else {
    //             console.log(dataArray.length + '---- ' + currentIndex);

    //             if (dataArray[currentIndex] < dataArray.length) {
    //                 console.log('file writing');
    //                 currentIndex = currentIndex + 1;
    //                 createHTMLFIles(dataArray, currentIndex, cb);
    //             } else {
    //                 cb(null, true);
    //             }
    //         }
    //         console.log('Saved!');
    //     });

}
