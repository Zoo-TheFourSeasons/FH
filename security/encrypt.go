package main

import (
	"C"
	"bufio"
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"encoding/hex"
	"fmt"
	"io/ioutil"
	"math"
	"os"
	"path"
	"strconv"
	"strings"
	"sync"
	"time"
)

type HelloEncrypt struct {
	HeaderEncrypt string
	//var HeaderEncrypt = "encrypted:"
	BinHeaderEncrypt []byte
	//var BinHeaderEncrypt = [] byte(HeaderEncrypt)
	LenHeaderEncrypt int64
	//var LenHeaderEncrypt = len(BinHeaderEncrypt)
	PswAes string
	//var PswAes = "123456"
	BinPswAes []byte
	//var BinPswAes = [] byte(PswAes)
	PswStream string
	//var PswStream = "123456"
	BinPswStream []byte
	//var BinPswStream = [] byte(PswStream)
	DoEncrypt bool
	//var DoEncrypt = true
	MaxSize int
	//var MaxSize = 64
	Include []string
	Exclude []string
	Nonce   string
}

func getFilesDirsFromDirs(dirsIn []string) (map[string][]string, []string) {

	files := make(map[string][]string)
	var dirs []string
	for _, pathIn := range dirsIn {
		files[pathIn] = []string{}

		items, err := ioutil.ReadDir(pathIn)
		if err != nil {
		}
		for _, item := range items {
			if item.IsDir() {
				dirs = append(dirs, path.Join(pathIn, item.Name()))
			} else {
				files[pathIn] = append(files[pathIn], item.Name())
			}
		}
	}
	return files, dirs
}

func getFilesMap(pathIn string) (map[string][]string, int64) {
	//fmt.Println("_getFilesFromDir", pathIn)

	filesMap := make(map[string][]string)
	files, dirs := getFilesDirsFromDirs([]string{pathIn})
	for root, file := range files {
		filesMap[root] = file
	}
	for {
		if len(dirs) == 0 {
			break
		}
		files, dirs = getFilesDirsFromDirs(dirs)
		for root, file := range files {
			filesMap[root] = file
		}
	}

	total := int64(0)

	for _, files := range filesMap {
		total += int64(len(files))
	}
	return filesMap, total
}

func (he *HelloEncrypt) checkInit() bool{
	passCheck := true
	if len(he.Nonce) != 24{
		fmt.Println("Nonce[24]:", len(he.Nonce))
		passCheck = false
	}
	if len(he.PswAes) != 32{
		fmt.Println("PswAes[32]:", len(he.PswAes))
		passCheck = false
	}
	if len(he.PswStream) != 32{
		fmt.Println("PswStream[32]:", len(he.PswStream))
		passCheck = false
	}
	return passCheck
}

func (he HelloEncrypt) _getFileSize(pathFile string) float64 {
	info, err := os.Stat(pathFile)
	if err != nil {
		return 0.0
	}
	return float64(info.Size() / 1024.0 / 1024.00)
}

// 流加密, 对称
func (he *HelloEncrypt) _encryptByStr(pathIn string) {
	fmt.Println("_encryptByStr", pathIn)
	raw, _ := ioutil.ReadFile(pathIn)
	lengthKey := len(he.PswStream)

	encrypt := []byte("")
	for _, v := range he.BinHeaderEncrypt {
		encrypt = append(encrypt, v)
	}

	k := 0
	for _, v := range raw{
		_j := he.BinPswStream[k%lengthKey]
		encrypt = append(encrypt, v^_j)
		k += 1
	}
	err := ioutil.WriteFile(pathIn, encrypt, 0666)
	if err != nil {
		fmt.Println("\rpass", pathIn, err)
	}
}

// 流解密, 对称
func (he *HelloEncrypt) _decryptByStr(pathIn string) {
	fmt.Println("_decryptByStr:", pathIn)
	_raw, _ := ioutil.ReadFile(pathIn)
	raw := _raw[he.LenHeaderEncrypt:]
	lengthKey := len(he.PswStream)
	decrypt := []byte("")
	k := 0
	for _, value := range raw {
		_j := he.BinPswStream[k%lengthKey]
		decrypt = append(decrypt, value^_j)
		k += 1
	}
	err := ioutil.WriteFile(pathIn, decrypt, 0666)
	if err != nil {
		fmt.Println("\rpass", pathIn, err)
	}
}

// AES加密, 对称
func (he *HelloEncrypt) _encryptByAes(pathIn string) bool {
	fmt.Println("_encryptByAes", pathIn)

	block, err := aes.NewCipher(he.BinPswAes)
	if err != nil{
		fmt.Println("_error", err)
		return false
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return false
	}

	raw, _ := ioutil.ReadFile(pathIn)
	iv, _ := hex.DecodeString(he.Nonce)

	text := gcm.Seal(nil, iv, raw, nil)

	err = ioutil.WriteFile(pathIn, text, 0666)
	if err != nil {
		return false
	}

	return true
}

// AES解密, 对称
func (he *HelloEncrypt) _decryptByAes(pathIn string) bool {
	fmt.Println("_decryptByAes:", pathIn)

	block, err := aes.NewCipher(he.BinPswAes)
	if err != nil {
		return false
	}
	gcm, _ := cipher.NewGCM(block)
	raw, _ := ioutil.ReadFile(pathIn)
	iv, _ := hex.DecodeString(he.Nonce)

	text, _ := gcm.Open(nil, iv, raw, nil)
	err = ioutil.WriteFile(pathIn, text, 0666)
	if err != nil {
		return false
	}
	return true
}

// 文件组合
func (he *HelloEncrypt) _combine(pathIn string) {
	ts := time.Now()

	fileMap, _ := getFilesMap(pathIn)
	tmp := make(map[string][]string)

	for root, files := range fileMap {
		for _, fileName := range files {
			// 不是文件片
			if !strings.HasSuffix(fileName, ".serial") {
				continue
			}
			// 检查是否跳过该文件
			if he._fileNameIsPass(fileName){
				continue
			}
			fmt.Println("\r_combine:", fileName)
			filePath := path.Join(root, fileName)

			fileNameSplit := strings.Split(fileName, ".")
			fileNameSplit = fileNameSplit[0:len(fileNameSplit) - 2]
			fileNameRaw := strings.Join(fileNameSplit, ".")
			filePathRaw := path.Join(root, fileNameRaw)

			_, exist := tmp[filePathRaw]
			if !exist{
				tmp[filePathRaw] = []string{}
			}
			tmp[filePathRaw] = append(tmp[filePathRaw], filePath)
		}
	}
	for filePathRaw, files := range tmp{
		fmt.Println(filePathRaw)

		file, _ := os.OpenFile(filePathRaw, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		for _, fileI := range files{
			raw, _ := ioutil.ReadFile(fileI)
			_, err := file.Write(raw)
			if err != nil{
				fmt.Println("_combine error:", fileI, err)
				continue
			}
			_ = os.Remove(fileI)
		}
	}
	fmt.Println("\nend _combine, cost:", time.Now().Sub(ts))
}

// 文件分片task
func (he *HelloEncrypt) routineSeparate(filesPathIn []string, filesSize []float64, wg *sync.WaitGroup) {
	// 分片
	for index, filePath := range filesPathIn{
		_size := filesSize[index]
		_i := 1
		_zeroFill := len(strconv.Itoa(int(math.Ceil((_size + float64(he.MaxSize) - 1) / float64(he.MaxSize)))))
		file, err := os.Open(filePath)
		if err != nil{
			continue
		}
		buff := make([] byte, he.MaxSize* 1024 * 1024)
		for {
			n, err1 := file.Read(buff)
			if err1 != nil {
				break
			}
			// 文件片i
			_fileI := filePath + fmt.Sprintf(".%0" + strconv.Itoa(_zeroFill) + "d", _i) + ".serial"
			fmt.Println(_fileI)

			err := ioutil.WriteFile(_fileI, buff[:n], 0666)
			if err != nil{
				continue
			}
			_i += 1
		}
		// 分片后移除自身
		err = file.Close()
		err = os.Remove(filePath)
		if err != nil{
			fmt.Println("_delete error:", filePath, err)
		}
	}
	wg.Done()
}
// 文件分片
func (he *HelloEncrypt) _separate(pathIn string) {
	fmt.Println("_separate:", pathIn)
	ts := time.Now()

	fileMap, _ := getFilesMap(pathIn)
	var tasks []string
	var tasksSize []float64
	var wg sync.WaitGroup

	for root, files := range fileMap {
		for _, fileName := range files {
			if he._fileNameIsPass(fileName) {
				fmt.Println("\rr_is_pass:", fileName)
				continue
			}
			filePath := path.Join(root, fileName)
			// 未达到分片阈值
			_size := he._getFileSize(filePath)
			if _size < float64(he.MaxSize+ 5){
				continue
			}
			tasks = append(tasks, filePath)
			tasksSize = append(tasksSize, _size)
		}
	}
	if len(tasks) < 4 * 4 {
		wg.Add(1)
		fmt.Println("routineSeparate:", 1, "taskPerRoutine:", len(tasks))
		go he.routineSeparate(tasks, tasksSize, &wg)
	} else {
		wg.Add(4)
		taskPerRoutine := int(math.Ceil(float64(len(tasks) + 3) / 4))
		fmt.Println("routineSeparate:", 4, "taskPerRoutine:", taskPerRoutine)
		go he.routineSeparate(tasks[:taskPerRoutine], tasksSize[:taskPerRoutine], &wg)
		go he.routineSeparate(tasks[taskPerRoutine:taskPerRoutine*2], tasksSize[taskPerRoutine:taskPerRoutine*2], &wg)
		go he.routineSeparate(tasks[taskPerRoutine*2:taskPerRoutine*3], tasksSize[taskPerRoutine*2:taskPerRoutine*3], &wg)
		go he.routineSeparate(tasks[taskPerRoutine*3:], tasksSize[taskPerRoutine*3:], &wg)
	}
	wg.Wait()
	fmt.Println("\nend _separate, cost:", time.Now().Sub(ts), " total:", len(tasks))
}

func (he *HelloEncrypt) _fileNameIsPass(_file string) bool {
	// 分片文件
	if strings.HasSuffix(_file, ".serial") {
		// 计算文件名
		tmp := strings.Split(_file, ".")
		tmp = tmp[:len(tmp)-2]
		_file = strings.Join(tmp, ".")
	}
	if len(he.Include) != 0 {
		// 仅处理
		inInclude := false
		for _, value := range he.Include {
			if value == _file {
				inInclude = true
			}
		}
		if !inInclude {
			return true
		}
	} else if len(he.Exclude) != 0 {
		// 不处理
		for _, value := range he.Exclude {
			if value == _file {
				return true
			}
		}
	}
	// 其他情况不跳过该文件
	return false
}

func (he *HelloEncrypt) routineEncryptOrDecrypt(pathFiles []string, wg *sync.WaitGroup) {
	for _, pathFile := range pathFiles {

		file, err := os.Open(pathFile)
		if err != nil {
			fmt.Println(err)
		}

		isEmpty := true
		HasPrefix := false
		scanner := bufio.NewScanner(file)
		line_i := 0
		for scanner.Scan() {
			line := scanner.Text()
			line = strings.TrimSpace(line)
			line_i += 1
			if line_i == 1 && bytes.HasPrefix([]byte(line), he.BinHeaderEncrypt) {
                HasPrefix = true
                isEmpty = false
                break
            }
			if line != "" {
			    isEmpty = false
			    break
			}
		}
		// 空文件
		if isEmpty {
			continue
		}
		// 文件已加密
		if HasPrefix {
			// 正在进行加密
			if he.DoEncrypt {
				// 忽略
				continue
			}
			// 正在进行解密
			// 流解密
			he._decryptByStr(pathFile)
			// AES解密
			he._decryptByAes(pathFile)
		} else {
			// 文件未加密
			// 正在进行加密
			if he.DoEncrypt {
				// AES加密
				he._encryptByAes(pathFile)
				// 流加密
				he._encryptByStr(pathFile)
			}
		}
	}
	wg.Done()
}

func (he *HelloEncrypt) _encryptOrDecrypt(pathIn string) bool {
	fmt.Println("_encryptOrDecrypt:", pathIn)
	ts := time.Now()

	_, err := os.Stat(pathIn)
	if err != nil {
		return false
	}

	info, err1 := os.Stat(pathIn)
	if err1 != nil {
		return false
	}
	var wg sync.WaitGroup
	var tasks []string

	if !info.IsDir() {
		tasks = append(tasks, pathIn)
	} else {
		fileMap, _ := getFilesMap(pathIn)
		for root, files := range fileMap {
			for _, file := range files {
				if he._fileNameIsPass(file) {
					continue
				}
				tasks = append(tasks, path.Join(root, file))
			}
		}
	}
	fmt.Println("tasks:", len(tasks))
	if len(tasks) < 4 * 4 {
		fmt.Println("routineEncryptOrDecrypt:", 1, "taskPerRoutine:", len(tasks))
		wg.Add(1)
		go he.routineEncryptOrDecrypt(tasks, &wg)
	} else {
		wg.Add(4)
		taskPerRoutine := int(math.Ceil(float64(len(tasks)+3) / 4))
		fmt.Println("routineEncryptOrDecrypt:", 4, "taskPerRoutine:", taskPerRoutine)
		go he.routineEncryptOrDecrypt(tasks[:taskPerRoutine], &wg)
		go he.routineEncryptOrDecrypt(tasks[taskPerRoutine:taskPerRoutine*2], &wg)
		go he.routineEncryptOrDecrypt(tasks[taskPerRoutine*2:taskPerRoutine*3], &wg)
		go he.routineEncryptOrDecrypt(tasks[taskPerRoutine*3:], &wg)
	}
	wg.Wait()
	fmt.Println("\nend encrypt_file, cost:", time.Now().Sub(ts), " total:", len(tasks))
	return true
}

func (he *HelloEncrypt) Security(pathIn string) {
	fmt.Println("do_encrypt", he.DoEncrypt)
	fmt.Println("path_in", pathIn)
	// 加密前分片
	if he.DoEncrypt {
		he._separate(pathIn)
	}

	// 加密/解密
	he._encryptOrDecrypt(pathIn)
	// 解密后组装
	if !he.DoEncrypt {
		he._combine(pathIn)
	}
}


func NewHelloEncrypt(PswAes, PswStream, Nonce string, MaxSize int) *HelloEncrypt {
	he := new(HelloEncrypt)
	he.PswAes = PswAes
	he.PswStream = PswStream
	he.Nonce = Nonce
	he.MaxSize = MaxSize
	he.HeaderEncrypt = "encrypted:"
	he.BinHeaderEncrypt = []byte(he.HeaderEncrypt)
	he.LenHeaderEncrypt = int64(len(he.BinHeaderEncrypt))
	he.BinPswAes = []byte(he.PswAes)
	he.BinPswStream = []byte(he.PswStream)
	return he
}


//export security
func security(DoEncrypt bool, PswAes, PswStream, Nonce, PathIn *C.char, MaxSize int){
    fmt.Println("MaxSize", MaxSize)
    he := NewHelloEncrypt(C.GoString(PswAes), C.GoString(PswStream), C.GoString(Nonce), MaxSize)
    he.DoEncrypt = DoEncrypt
    he.Security(C.GoString(PathIn))
}

func main() {
}
